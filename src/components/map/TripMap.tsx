"use client";
import { useEffect, useRef, useState } from "react";
import { Trip, Day, Place } from "@/types";
import { MapPin, Navigation, Eye, Coffee, Hotel, Zap } from "lucide-react";

interface TripMapProps {
  trip: Partial<Trip>;
  selectedDay?: number;
  onPlaceSelect?: (place: Place) => void;
  className?: string;
}

// Color palette per day
const DAY_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

const PLACE_ICONS: Record<Place["type"], string> = {
  destination: "🏛️",
  viewpoint: "👁️",
  restaurant: "🍽️",
  hotel: "🏨",
  activity: "⚡",
};

export default function TripMap({
  trip,
  selectedDay,
  onPlaceSelect,
  className = "",
}: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const routeLinesRef = useRef<L.LayerGroup | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapRef.current) return;

    // Dynamically import Leaflet (SSR fix)
    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Fix default icon
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }

      const map = L.map(mapRef.current!, {
        center: [20, 0],
        zoom: 3,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // OpenStreetMap tiles — 100% free, no API key
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Optional: CartoDB dark tiles (free)
      // L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      //   attribution: '© OpenStreetMap contributors © CARTO',
      //   maxZoom: 19,
      // }).addTo(map);

      markersRef.current = L.layerGroup().addTo(map);
      routeLinesRef.current = L.layerGroup().addTo(map);
      leafletMapRef.current = map;
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  // Update markers and routes when trip or selectedDay changes
  useEffect(() => {
    if (!isClient || !leafletMapRef.current || !markersRef.current) return;

    const updateMap = async () => {
      const L = (await import("leaflet")).default;

      markersRef.current!.clearLayers();
      routeLinesRef.current!.clearLayers();

      const allBounds: L.LatLngTuple[] = [];
      const days = trip.days || [];

      const daysToShow =
        selectedDay !== undefined
          ? days.filter((d) => d.day === selectedDay)
          : days;

      daysToShow.forEach((day: Day) => {
        const color = DAY_COLORS[(day.day - 1) % DAY_COLORS.length];
        const dayCoords: L.LatLngTuple[] = [];

        // Draw route polyline between places
        if (day.places && day.places.length > 1) {
          const routeCoords: L.LatLngTuple[] = day.places
            .filter((p) => p.coordinates && p.coordinates.length === 2)
            .map((p) => [p.coordinates[0], p.coordinates[1]] as L.LatLngTuple);

          if (routeCoords.length > 1) {
            L.polyline(routeCoords, {
              color,
              weight: 3,
              opacity: 0.7,
              dashArray: "8, 6",
            }).addTo(routeLinesRef.current!);
          }
        }

        // Add markers for each place
        day.places?.forEach((place: Place, placeIndex: number) => {
          if (!place.coordinates || place.coordinates.length !== 2) return;

          const [lat, lng] = place.coordinates;
          if (isNaN(lat) || isNaN(lng)) return;

          const coords: L.LatLngTuple = [lat, lng];
          allBounds.push(coords);
          dayCoords.push(coords);

          const emoji = PLACE_ICONS[place.type] || "📍";

          // Custom HTML marker
          const markerHtml = `
            <div style="
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 40px;
              height: 40px;
            ">
              <div style="
                width: 36px;
                height: 36px;
                background: ${color};
                border: 3px solid white;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                cursor: pointer;
                transition: transform 0.2s;
              "></div>
              <div style="
                position: absolute;
                font-size: 14px;
                top: 4px;
                left: 50%;
                transform: translateX(-50%);
              ">${emoji}</div>
              <div style="
                position: absolute;
                bottom: -2px;
                right: -2px;
                width: 16px;
                height: 16px;
                background: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 9px;
                font-weight: bold;
                color: ${color};
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">${placeIndex + 1}</div>
            </div>
          `;

          const customIcon = L.divIcon({
            html: markerHtml,
            className: "custom-marker",
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -42],
          });

          const marker = L.marker(coords, { icon: customIcon });

          const popupHtml = `
            <div style="min-width: 200px;">
              <div style="
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 4px;
                color: #f8fafc;
              ">${emoji} ${place.name}</div>
              <div style="
                font-size: 11px;
                color: #94a3b8;
                background: ${color}22;
                padding: 2px 8px;
                border-radius: 20px;
                display: inline-block;
                margin-bottom: 6px;
                border: 1px solid ${color}44;
              ">Day ${day.day} · ${place.type}</div>
              ${
                place.duration
                  ? `<div style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">⏱ ${place.duration}</div>`
                  : ""
              }
              <p style="font-size: 12px; color: #cbd5e1; margin: 0; line-height: 1.5;">${
                place.description?.slice(0, 120) + "..." || ""
              }</p>
              ${
                place.tips
                  ? `<div style="font-size: 11px; color: #fbbf24; margin-top: 6px; padding: 4px 8px; background: rgba(251,191,36,0.1); border-radius: 6px;">💡 ${place.tips.slice(0, 80)}</div>`
                  : ""
              }
            </div>
          `;

          marker.bindPopup(popupHtml, {
            maxWidth: 260,
            className: "custom-popup",
          });

          marker.on("click", () => {
            setSelectedPlace(place);
            onPlaceSelect?.(place);
          });

          marker.addTo(markersRef.current!);
        });
      });

      // Fit map to all markers
      if (allBounds.length > 0) {
        const bounds = L.latLngBounds(allBounds);
        leafletMapRef.current!.fitBounds(bounds, { padding: [40, 40] });
      }
    };

    updateMap();
  }, [trip, selectedDay, isClient, onPlaceSelect]);

  const placeTypes = [
    { icon: <MapPin className="w-3 h-3" />, label: "Destination", color: "#3b82f6" },
    { icon: <Eye className="w-3 h-3" />, label: "Viewpoint", color: "#8b5cf6" },
    { icon: <Coffee className="w-3 h-3" />, label: "Restaurant", color: "#10b981" },
    { icon: <Hotel className="w-3 h-3" />, label: "Hotel", color: "#f59e0b" },
    { icon: <Zap className="w-3 h-3" />, label: "Activity", color: "#ef4444" },
  ];

  if (!isClient) {
    return (
      <div
        className={`${className} bg-slate-800 rounded-2xl flex items-center justify-center`}
      >
        <div className="text-slate-400 text-sm flex items-center gap-2">
          <Navigation className="w-4 h-4 animate-spin" />
          Loading map...
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div ref={mapRef} className="w-full h-full rounded-2xl z-0" />

      {/* Legend */}
      {trip.days && trip.days.length > 0 && (
        <div className="absolute bottom-4 left-4 glass rounded-xl px-3 py-2 z-10 flex flex-col gap-1.5 text-xs">
          {DAY_COLORS.slice(0, trip.days.length).map((color, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border border-white/30"
                style={{ background: color }}
              />
              <span className="text-slate-300">
                Day {i + 1}
                {trip.days![i]?.title ? ` — ${trip.days![i].title.slice(0, 20)}` : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Attribution */}
      <div className="absolute top-2 right-2 glass rounded-lg px-2 py-1 text-xs text-slate-400 z-10">
        🗺 OpenStreetMap (Free)
      </div>

      {/* Selected place card */}
      {selectedPlace && (
        <div className="absolute top-4 left-4 right-4 glass rounded-xl p-3 z-10 max-w-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-white truncate">
                {PLACE_ICONS[selectedPlace.type]} {selectedPlace.name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                {selectedPlace.description}
              </p>
            </div>
            <button
              onClick={() => setSelectedPlace(null)}
              className="text-slate-500 hover:text-white text-xs shrink-0"
            >
              ✕
            </button>
          </div>
          {selectedPlace.duration && (
            <div className="mt-2 text-xs text-blue-400 flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              {selectedPlace.duration}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
