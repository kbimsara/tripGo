"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Trip, Day, Place } from "@/types";
import {
  Navigation, Route, Clock, MapPin, ExternalLink,
  ChevronDown, ChevronUp, Car, Footprints, Bike, Loader2,
} from "lucide-react";

interface TripMapProps {
  trip: Partial<Trip>;
  selectedDay?: number;
  onPlaceSelect?: (place: Place) => void;
  className?: string;
}

// ── Per-day colour palette ────────────────────────────────────────────
const DAY_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#84cc16",
];

const PLACE_ICONS: Record<Place["type"], string> = {
  destination: "🏛️",
  viewpoint: "👁️",
  restaurant: "🍽️",
  hotel: "🏨",
  activity: "⚡",
};

// ── Outlier coordinate filter ─────────────────────────────────────────
// When the LLM hallucinates a coordinate (e.g. puts one pin in Ireland while
// the rest are in Sri Lanka), fitBounds zooms out to show both continents and
// the map appears blank. Fix: discard any place whose lat or lng is more than
// 30 degrees from the median of all places in that day.
function filterCoordinateOutliers(places: Place[]): Place[] {
  if (places.length <= 2) return places;

  const sorted = (arr: number[]) => [...arr].sort((a, b) => a - b);
  const median = (arr: number[]) => {
    const s = sorted(arr);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  };

  const medLat = median(places.map((p) => p.coordinates[0]));
  const medLng = median(places.map((p) => p.coordinates[1]));

  return places.filter((p) => {
    const [lat, lng] = p.coordinates;
    return Math.abs(lat - medLat) <= 30 && Math.abs(lng - medLng) <= 30;
  });
}

// ── OSRM road-routing (free, no API key) ─────────────────────────────
interface RouteSegment {
  from: Place;
  to: Place;
  distanceKm: number;
  durationMin: number;
  coords: [number, number][]; // [lat, lng]
}

// OSRM profile → API path segment
const OSRM_PROFILE: Record<string, string> = {
  driving: "driving",
  walking: "foot",
  cycling: "bike",
};

async function fetchRoadRoute(
  from: Place,
  to: Place,
  mode: "driving" | "walking" | "cycling" = "driving"
): Promise<RouteSegment | null> {
  if (!from.coordinates?.length || !to.coordinates?.length) return null;
  const [fLat, fLng] = from.coordinates;
  const [tLat, tLng] = to.coordinates;

  try {
    // OSRM public demo server — 100% free, OpenStreetMap-based
    const profile = OSRM_PROFILE[mode] ?? "driving";
    const url =
      `https://router.project-osrm.org/route/v1/${profile}/` +
      `${fLng},${fLat};${tLng},${tLat}` +
      `?geometries=geojson&overview=full&steps=false`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();

    if (data.code !== "Ok" || !data.routes?.length) return null;

    const route = data.routes[0];
    // GeoJSON coords are [lng, lat] → flip to [lat, lng] for Leaflet
    const coords: [number, number][] = (
      route.geometry.coordinates as [number, number][]
    ).map(([lng, lat]) => [lat, lng]);

    return {
      from,
      to,
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMin: Math.round(route.duration / 60),
      coords,
    };
  } catch {
    return null; // silent fallback handled by caller
  }
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function googleMapsNavUrl(from: Place, to: Place): string {
  const [fLat, fLng] = from.coordinates;
  const [tLat, tLng] = to.coordinates;
  return `https://www.google.com/maps/dir/${fLat},${fLng}/${tLat},${tLng}`;
}

// ── Map loading skeleton ──────────────────────────────────────────────
function MapSkeleton({ className }: { className?: string }) {
  return (
    <div className={`${className} flex flex-col items-center justify-center gap-3 rounded-2xl bg-slate-800`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15">
        <Navigation className="h-6 w-6 animate-spin text-blue-400" />
      </div>
      <p className="text-sm text-slate-400">Loading map…</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function TripMap({ trip, selectedDay, onPlaceSelect, className = "" }: TripMapProps) {
  const mapRef        = useRef<HTMLDivElement>(null);
  const leafletMap    = useRef<L.Map | null>(null);
  const markerLayer   = useRef<L.LayerGroup | null>(null);
  const routeLayer    = useRef<L.LayerGroup | null>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  // Incremented on every renderMap call so stale async continuations can self-cancel
  const renderTokenRef = useRef(0);

  const [isClient, setIsClient]       = useState(false);
  const [mapReady, setMapReady]       = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
  const [routeLoading, setRouteLoading]   = useState(false);
  const [panelOpen, setPanelOpen]         = useState(true);
  const [routeMode, setRouteMode]         = useState<"driving" | "walking" | "cycling" | "straight">("driving");

  useEffect(() => { setIsClient(true); }, []);

  // ── Init Leaflet map (once) ─────────────────────────────────────────
  useEffect(() => {
    if (!isClient || !mapRef.current) return;

    const init = async () => {
      const L = (await import("leaflet")).default;
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

      if (leafletMap.current) { leafletMap.current.remove(); }

      const map = L.map(mapRef.current!, {
        center: [20, 0], zoom: 3,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.control.attribution({ position: "bottomleft", prefix: false })
        .addAttribution('© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>')
        .addTo(map);

      // CartoDB dark tiles (free, looks great)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { maxZoom: 19 }
      ).addTo(map);

      markerLayer.current = L.layerGroup().addTo(map);
      routeLayer.current  = L.layerGroup().addTo(map);
      leafletMap.current  = map;

      // Fix split tiles: Leaflet measures the container before CSS gives it
      // its final height. Wait one paint frame then invalidate + mark ready.
      setTimeout(() => {
        map.invalidateSize();
        setMapReady(true);
      }, 150);

      // Re-invalidate whenever the container is resized (tab switches, etc.)
      if (mapRef.current) {
        resizeObserver.current = new ResizeObserver(() => {
          leafletMap.current?.invalidateSize();
        });
        resizeObserver.current.observe(mapRef.current);
      }
    };

    init();
    return () => {
      resizeObserver.current?.disconnect();
      resizeObserver.current = null;
      leafletMap.current?.remove();
      leafletMap.current = null;
      setMapReady(false);
    };
  }, [isClient]);

  // ── Render markers & routes when trip/day changes ──────────────────
  const renderMap = useCallback(async () => {
    if (!isClient || !mapReady || !leafletMap.current || !markerLayer.current) return;
    // Capture a token so we can bail if a newer renderMap call starts while we await
    const myToken = ++renderTokenRef.current;

    const L = (await import("leaflet")).default;
    markerLayer.current!.clearLayers();
    routeLayer.current!.clearLayers();
    setRouteSegments([]);

    const days      = trip.days || [];
    const daysToShow = selectedDay !== undefined
      ? days.filter((d) => d.day === selectedDay)
      : days;

    const allBounds: L.LatLngTuple[] = [];
    const newSegments: RouteSegment[] = [];

    for (const day of daysToShow) {
      const color   = DAY_COLORS[(day.day - 1) % DAY_COLORS.length];
      const validCoords = (day.places ?? []).filter((p) => {
        if (!Array.isArray(p.coordinates) || p.coordinates.length !== 2) return false;
        const [lat, lng] = p.coordinates;
        return typeof lat === "number" && typeof lng === "number"
          && !isNaN(lat) && !isNaN(lng)
          && !(lat === 0 && lng === 0)
          && lat >= -90 && lat <= 90
          && lng >= -180 && lng <= 180;
      });
      // Remove geographic outliers (e.g. one pin in a different country due to
      // LLM hallucination that slipped past geocoding).
      const places = filterCoordinateOutliers(validCoords);

      // Add numbered markers
      places.forEach((place, idx) => {
        const [lat, lng] = place.coordinates;
        if (isNaN(lat) || isNaN(lng)) return;
        const coords: L.LatLngTuple = [lat, lng];
        allBounds.push(coords);

        const emoji = PLACE_ICONS[place.type] ?? "📍";

        const icon = L.divIcon({
          className: "custom-marker",
          iconSize:   [42, 42],
          iconAnchor: [21, 42],
          popupAnchor:[0, -46],
          html: `
            <div style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;">
              <div style="
                width:38px;height:38px;
                background:${color};
                border:3px solid #fff;
                border-radius:50% 50% 50% 0;
                transform:rotate(-45deg);
                box-shadow:0 4px 14px rgba(0,0,0,0.5);
              "></div>
              <span style="position:absolute;top:4px;left:50%;transform:translateX(-50%);font-size:15px;line-height:1;">${emoji}</span>
              <span style="
                position:absolute;bottom:-1px;right:-1px;
                width:17px;height:17px;
                background:#fff;border-radius:50%;
                display:flex;align-items:center;justify-content:center;
                font-size:9px;font-weight:700;color:${color};
                box-shadow:0 2px 5px rgba(0,0,0,0.35);
              ">${idx + 1}</span>
            </div>`,
        });

        const marker = L.marker(coords, { icon });

        // Build popup HTML with navigation button
        const nextPlace = places[idx + 1];
        const navBtn = nextPlace
          ? `<a href="${googleMapsNavUrl(place, nextPlace)}" target="_blank" rel="noopener"
               style="
                 display:inline-flex;align-items:center;gap:5px;margin-top:8px;
                 padding:5px 10px;border-radius:8px;font-size:11px;font-weight:600;
                 background:#3b82f6;color:#fff;text-decoration:none;
               ">
               🧭 Navigate to next stop
             </a>`
          : "";

        const gmapsLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

        marker.bindPopup(`
          <div style="min-width:210px;font-family:'Inter',sans-serif;">
            <div style="font-weight:700;font-size:14px;color:#f8fafc;margin-bottom:4px;">
              ${emoji} ${place.name}
            </div>
            <span style="
              font-size:10px;background:${color}22;color:${color};
              padding:2px 8px;border-radius:20px;border:1px solid ${color}44;
              display:inline-block;margin-bottom:6px;text-transform:capitalize;
            ">Day ${day.day} · ${place.type}</span>
            ${place.duration
              ? `<div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">⏱ ${place.duration}</div>`
              : ""}
            <p style="font-size:12px;color:#cbd5e1;margin:0 0 6px;line-height:1.5;">
              ${(place.description ?? "").slice(0, 120)}…
            </p>
            ${place.tips
              ? `<div style="font-size:11px;color:#fbbf24;padding:4px 8px;background:rgba(251,191,36,.1);border-radius:6px;margin-bottom:6px;">
                   💡 ${place.tips.slice(0, 90)}
                 </div>`
              : ""}
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <a href="${gmapsLink}" target="_blank" rel="noopener"
                 style="
                   display:inline-flex;align-items:center;gap:4px;
                   padding:4px 9px;border-radius:7px;font-size:11px;font-weight:600;
                   background:rgba(255,255,255,.08);color:#cbd5e1;
                   text-decoration:none;border:1px solid rgba(255,255,255,.12);
                 ">
                 📍 View on Maps
              </a>
              ${navBtn}
            </div>
          </div>`, { maxWidth: 280 });

        marker.on("click", () => {
          setSelectedPlace(place);
          onPlaceSelect?.(place);
        });

        marker.addTo(markerLayer.current!);
      });

      // Fetch OSRM road routes for consecutive pairs (in parallel)
      if (places.length >= 2) {
        if (routeMode !== "straight") {
          setRouteLoading(true);
          const pairs = places.slice(0, -1).map((fromPlace, i) => ({
            fromPlace,
            toPlace: places[i + 1],
          }));

          const results = await Promise.all(
            pairs.map(({ fromPlace, toPlace }) =>
              fetchRoadRoute(fromPlace, toPlace, routeMode)
            )
          );

          // If the map was destroyed or a newer render started while we were
          // awaiting OSRM, discard this stale result and bail out.
          if (myToken !== renderTokenRef.current || !routeLayer.current || !leafletMap.current) {
            setRouteLoading(false);
            return;
          }

          for (let i = 0; i < pairs.length; i++) {
            const seg = results[i];
            const { fromPlace, toPlace } = pairs[i];

            if (seg) {
              newSegments.push(seg);
              L.polyline(seg.coords, {
                color, weight: 4, opacity: 0.85,
                lineJoin: "round", lineCap: "round",
              }).addTo(routeLayer.current!);

              const midIdx = Math.floor(seg.coords.length / 2);
              const [mLat, mLng] = seg.coords[midIdx] ?? [
                (fromPlace.coordinates[0] + toPlace.coordinates[0]) / 2,
                (fromPlace.coordinates[1] + toPlace.coordinates[1]) / 2,
              ];
              L.marker([mLat, mLng], {
                icon: L.divIcon({
                  className: "custom-marker",
                  iconSize: [72, 22],
                  iconAnchor: [36, 11],
                  html: `
                    <div style="
                      background:rgba(15,23,42,.85);backdrop-filter:blur(8px);
                      border:1px solid ${color}55;border-radius:20px;
                      padding:2px 8px;font-size:10px;font-weight:600;
                      color:${color};white-space:nowrap;
                      box-shadow:0 2px 8px rgba(0,0,0,.5);
                    ">${routeMode === "walking" ? "🚶" : routeMode === "cycling" ? "🚴" : "🚗"} ${seg.distanceKm} km · ${formatDuration(seg.durationMin)}</div>`,
                }),
                interactive: false,
                zIndexOffset: -100,
              }).addTo(routeLayer.current!);
            } else {
              const fallbackCoords: L.LatLngTuple[] = [
                fromPlace.coordinates as L.LatLngTuple,
                toPlace.coordinates as L.LatLngTuple,
              ];
              L.polyline(fallbackCoords, {
                color, weight: 2, opacity: 0.5, dashArray: "6,5",
              }).addTo(routeLayer.current!);
            }
          }
        } else {
          for (let i = 0; i < places.length - 1; i++) {
            L.polyline(
              [places[i].coordinates as L.LatLngTuple, places[i + 1].coordinates as L.LatLngTuple],
              { color, weight: 2.5, opacity: 0.6, dashArray: "7,5" }
            ).addTo(routeLayer.current!);
          }
        }
      }
    }

    setRouteLoading(false);
    if (newSegments.length) setRouteSegments(newSegments);

    // Fit bounds — use ?. in case the map was torn down between the last await and here
    if (allBounds.length > 0) {
      const bounds = L.latLngBounds(allBounds);
      leafletMap.current?.fitBounds(bounds, { padding: [50, 50] });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip, selectedDay, isClient, mapReady, onPlaceSelect, routeMode]);

  useEffect(() => { renderMap(); }, [renderMap]);

  // ── Aggregate route data for panel ────────────────────────────────
  const totalDistanceKm = routeSegments.reduce((s, r) => s + r.distanceKm, 0);
  const totalDurationMin = routeSegments.reduce((s, r) => s + r.durationMin, 0);

  const allPlacesForDay = filterCoordinateOutliers(
    (trip.days ?? [])
      .filter((d) => selectedDay === undefined || d.day === selectedDay)
      .flatMap((d) => d.places ?? [])
      .filter((p) =>
        Array.isArray(p.coordinates) && p.coordinates.length === 2
        && !(p.coordinates[0] === 0 && p.coordinates[1] === 0)
      )
  );

  // Google Maps multi-stop URL for the full day route
  const fullDayGmapsUrl = (() => {
    if (allPlacesForDay.length < 2) return null;
    const origin  = allPlacesForDay[0].coordinates.join(",");
    const dest    = allPlacesForDay.at(-1)!.coordinates.join(",");
    const waypts  = allPlacesForDay
      .slice(1, -1)
      .map((p) => p.coordinates.join(","))
      .join("/");
    return `https://www.google.com/maps/dir/${origin}/${waypts ? waypts + "/" : ""}${dest}`;
  })();

  if (!isClient) return <MapSkeleton className={className} />;

  return (
    <div className={`relative flex flex-col overflow-hidden rounded-2xl ${className}`}>

      {/* ── Map canvas ─────────────────────────────────────────────── */}
      <div ref={mapRef} className="w-full flex-1 z-0 min-h-0" />

      {/* ── Route mode toggle (top-left) ──────────────────────────── */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-1">
        {(
          [
            { mode: "driving",  label: "Drive",  icon: <Car           className="h-3 w-3" /> },
            { mode: "walking",  label: "Walk",   icon: <Footprints    className="h-3 w-3" /> },
            { mode: "cycling",  label: "Cycle",  icon: <Bike          className="h-3 w-3" /> },
            { mode: "straight", label: "Direct", icon: <Route         className="h-3 w-3" /> },
          ] as const
        ).map(({ mode, label, icon }) => (
          <button
            key={mode}
            onClick={() => setRouteMode(mode)}
            title={`${label} routing`}
            className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium shadow transition-all ${
              routeMode === mode
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "glass border border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
        {routeLoading && (
          <div className="flex items-center gap-1 rounded-lg glass border border-white/10 px-2.5 py-1.5 text-xs text-blue-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="hidden sm:inline">Routing…</span>
          </div>
        )}
      </div>

      {/* ── Attribution ───────────────────────────────────────────── */}
      <div className="absolute right-2 top-2 z-10 rounded-lg glass border border-white/8 px-2 py-1 text-xs text-slate-400">
        🗺 OpenStreetMap · OSRM Routing
      </div>

      {/* ── Day legend (bottom-left) ──────────────────────────────── */}
      {trip.days && trip.days.length > 0 && (
        <div className="absolute bottom-16 left-3 z-10 flex flex-col gap-1.5 rounded-xl glass border border-white/8 px-3 py-2 text-xs">
          {DAY_COLORS.slice(0, trip.days.length).map((col, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full border border-white/30" style={{ background: col }} />
              <span className="text-slate-300">
                Day {i + 1}
                {trip.days![i]?.title ? ` — ${trip.days![i].title.slice(0, 18)}` : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Route summary panel (bottom) ─────────────────────────── */}
      {routeSegments.length > 0 && (
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="glass rounded-2xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden">

            {/* Header */}
            <button
              onClick={() => setPanelOpen(!panelOpen)}
              className="flex w-full items-center justify-between px-4 py-2.5"
            >
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <Navigation className="h-4 w-4 text-blue-400" />
                  Route Summary
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Route className="h-3 w-3" />
                    {totalDistanceKm.toFixed(1)} km
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(totalDurationMin)} drive
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {routeSegments.length + 1} stops
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {fullDayGmapsUrl && (
                  <a
                    href={fullDayGmapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open in Maps
                  </a>
                )}
                {panelOpen
                  ? <ChevronDown className="h-4 w-4 text-slate-400" />
                  : <ChevronUp   className="h-4 w-4 text-slate-400" />}
              </div>
            </button>

            {/* Segments list */}
            {panelOpen && (
              <div className="max-h-36 overflow-y-auto border-t border-white/5 px-4 py-2 scrollbar-none">
                {routeSegments.map((seg, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 text-xs">
                    {/* Step connector */}
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="h-2 w-2 rounded-full bg-slate-400" />
                      <div className="h-3 w-px bg-slate-600" />
                      <div className="h-2 w-2 rounded-full bg-blue-400" />
                    </div>
                    {/* Route info */}
                    <div className="flex flex-1 min-w-0 items-center justify-between">
                      <div className="min-w-0">
                        <span className="text-slate-300 truncate font-medium">
                          {seg.from.name}
                        </span>
                        <span className="mx-1.5 text-slate-600">→</span>
                        <span className="text-slate-300 truncate font-medium">
                          {seg.to.name}
                        </span>
                      </div>
                      <div className="ml-3 flex shrink-0 items-center gap-2 text-slate-500">
                        <span className="flex items-center gap-0.5">
                          <Route className="h-2.5 w-2.5" />
                          {seg.distanceKm} km
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDuration(seg.durationMin)}
                        </span>
                        <a
                          href={googleMapsNavUrl(seg.from, seg.to)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-0.5 rounded-md bg-blue-500/15 px-1.5 py-0.5 text-blue-400 hover:bg-blue-500/25 transition-colors"
                        >
                          <Navigation className="h-2.5 w-2.5" />
                          Go
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Selected place card (top) ─────────────────────────────── */}
      {selectedPlace && (
        <div className="absolute left-3 right-3 top-12 z-10 max-w-xs">
          <div className="glass rounded-xl border border-white/10 p-3 shadow-xl shadow-black/30">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {PLACE_ICONS[selectedPlace.type]} {selectedPlace.name}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">
                  {selectedPlace.description}
                </p>
              </div>
              <button
                onClick={() => setSelectedPlace(null)}
                className="shrink-0 text-xs text-slate-500 hover:text-white"
              >✕</button>
            </div>
            {selectedPlace.duration && (
              <div className="mt-2 flex items-center gap-1 text-xs text-blue-400">
                <Clock className="h-3 w-3" />
                {selectedPlace.duration}
              </div>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selectedPlace.coordinates[0]},${selectedPlace.coordinates[1]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors w-fit"
            >
              <ExternalLink className="h-3 w-3" />
              View on Google Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
