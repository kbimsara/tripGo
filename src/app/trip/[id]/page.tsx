"use client";
import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  Globe,
  Lock,
  Heart,
  Copy,
  Share2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Map,
  List,
  Settings,
  Eye,
  Coffee,
  Hotel,
  Zap,
  Navigation,
  Calendar,
  DollarSign,
  Loader2,
  Trash2,
  Sparkles,
  Route,
} from "lucide-react";
import dynamic from "next/dynamic";
import Navbar from "@/components/ui/Navbar";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import ChatPanel from "@/components/chat/ChatPanel";
import { Trip, Place, ChatMessage } from "@/types";
import { formatDate, getImageUrl } from "@/lib/utils";

const TripMap = dynamic(() => import("@/components/map/TripMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-800 rounded-2xl flex items-center justify-center">
      <div className="text-slate-400 flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading map...
      </div>
    </div>
  ),
});

const PLACE_TYPE_ICONS: Record<Place["type"], React.ReactNode> = {
  destination: <MapPin className="w-4 h-4" />,
  viewpoint:   <Eye className="w-4 h-4" />,
  restaurant:  <Coffee className="w-4 h-4" />,
  hotel:       <Hotel className="w-4 h-4" />,
  activity:    <Zap className="w-4 h-4" />,
};

const PLACE_TYPE_COLORS: Record<Place["type"], string> = {
  destination: "text-blue-600 bg-blue-50 border-blue-100",
  viewpoint:   "text-violet-600 bg-violet-50 border-violet-100",
  restaurant:  "text-emerald-600 bg-emerald-50 border-emerald-100",
  hotel:       "text-amber-600 bg-amber-50 border-amber-100",
  activity:    "text-red-600 bg-red-50 border-red-100",
};

const DAY_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
];

type Tab = "itinerary" | "map" | "chat";

export default function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("itinerary");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cloning, setCloning] = useState(false);

  const { toast } = useToast();
  const isOwner = session?.user?.id && trip?.owner?._id === session.user.id;

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await fetch(`/api/trips/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setTrip(data.trip);
        setChatHistory(data.trip.chatHistory || []);
        setIsPublic(data.trip.isPublic);
        setIsSaved(data.trip.savedBy?.includes(session?.user?.id || "") || false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load trip");
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [id, session?.user?.id]);

  const handleSave = async () => {
    if (!session) { router.push("/login"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/trips/${id}/save`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setIsSaved(data.saved);
      toast(data.saved ? "Trip saved!" : "Trip unsaved", data.saved ? "success" : "info");
    } catch {
      toast("Failed to save trip", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleClone = async () => {
    if (!session) { router.push("/login"); return; }
    setCloning(true);
    try {
      const res = await fetch(`/api/trips/${id}/save`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clone");
      toast("Trip cloned! Redirecting...");
      if (data.trip) router.push(`/trip/${data.trip._id}`);
    } catch {
      toast("Failed to clone trip", "error");
    } finally {
      setCloning(false);
    }
  };

  const togglePublic = async () => {
    setTogglingPublic(true);
    try {
      const res = await fetch(`/api/trips/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic }),
      });
      if (res.ok) {
        setIsPublic(!isPublic);
        toast(!isPublic ? "Trip is now public" : "Trip is now private");
      } else {
        toast("Failed to update visibility", "error");
      }
    } catch {
      toast("Failed to update visibility", "error");
    } finally {
      setTogglingPublic(false);
    }
  };

  const deleteTrip = async () => {
    if (!confirm("Delete this trip? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/trips/${id}`, { method: "DELETE" });
    router.push("/dashboard");
  };

  const handleTripUpdate = (updatedTrip: Partial<Trip>) => {
    setTrip((prev) => prev ? { ...prev, ...updatedTrip } : prev);
  };

  const shareTrip = () => {
    navigator.clipboard.writeText(window.location.href);
    toast("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading your trip...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-red-500 mb-4">{error || "Trip not found"}</p>
          <Button onClick={() => router.push("/explore")}>Browse Trips</Button>
        </div>
      </div>
    );
  }

  const currentDay = trip.days?.find((d) => d.day === selectedDay);
  const coverImage =
    trip.coverImage ||
    getImageUrl(
      trip.coverImageQuery || trip.destinations?.join(" ") || "travel",
      1200,
      500
    );

  const NAV_TABS = [
    { id: "itinerary" as Tab, icon: <List className="w-4 h-4" />,        label: "Itinerary" },
    { id: "map"       as Tab, icon: <Map className="w-4 h-4" />,         label: "Map" },
    { id: "chat"      as Tab, icon: <MessageSquare className="w-4 h-4" />, label: "AI Chat", ownerOnly: true },
  ].filter((t) => !t.ownerOnly || isOwner);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* ── Hero Banner ── */}
      <div className="relative h-64 sm:h-72 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImage}
          alt={trip.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              `https://picsum.photos/seed/${encodeURIComponent(trip.title)}/1200/500`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-transparent" />

        {/* Title content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${
                  isPublic
                    ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                    : "border-white/15 bg-black/30 text-slate-300"
                }`}
              >
                {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {isPublic ? "Public" : "Private"}
              </span>
              {trip.tags?.slice(0, 3).map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full text-xs text-slate-200 border border-white/15 bg-black/20 backdrop-blur-sm">
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2 drop-shadow-xl">
              {trip.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-400" />
                {trip.destinations?.join(" → ")}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-violet-400" />
                {trip.totalDays} days
              </span>
              {trip.budget && (
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  {trip.budget}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                {formatDate(trip.createdAt)}
              </span>
              {trip.saves > 0 && (
                <span className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 fill-red-400 text-red-400" />
                  {trip.saves} saves
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="absolute top-20 right-4 sm:right-6 flex gap-2">
          {isOwner ? (
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2.5 rounded-xl border border-white/20 bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden z-50"
                  >
                    <button
                      onClick={togglePublic}
                      disabled={togglingPublic}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 text-left"
                    >
                      {isPublic ? <Lock className="w-4 h-4 text-slate-400" /> : <Globe className="w-4 h-4 text-slate-400" />}
                      {isPublic ? "Make Private" : "Make Public"}
                    </button>
                    <button
                      onClick={shareTrip}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 text-left"
                    >
                      <Share2 className="w-4 h-4 text-slate-400" />
                      Copy Link
                    </button>
                    <div className="border-t border-slate-100" />
                    <button
                      onClick={deleteTrip}
                      disabled={deleting}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 text-left"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Trip
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              {session && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-2.5 rounded-xl border border-white/20 bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-colors"
                >
                  <Heart className={`w-5 h-5 ${isSaved ? "fill-red-400 text-red-400" : ""}`} />
                </button>
              )}
              <Button
                onClick={handleClone}
                loading={cloning}
                size="sm"
                variant="ghost"
                icon={<Copy className="w-4 h-4" />}
              >
                Clone Trip
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 pt-6">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Left: Main Content ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Owner info */}
            <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {(trip.owner as { name: string })?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {(trip.owner as { name: string })?.name}
                </p>
                <p className="text-xs text-slate-500">Trip creator</p>
              </div>
              {trip.originalTrip && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
                  <Copy className="w-3 h-3" />
                  Cloned trip
                </div>
              )}
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-sm w-fit">
              {NAV_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === t.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {t.icon}
                  {t.label}
                  {t.id === "chat" && chatHistory.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold">
                      {chatHistory.filter((m) => m.role === "user").length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content area */}
            <AnimatePresence mode="wait">
              {tab === "itinerary" && (
                <motion.div
                  key="itinerary"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* Day selector */}
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {trip.days?.map((day) => {
                      const colorClass = DAY_COLORS[(day.day - 1) % DAY_COLORS.length];
                      return (
                        <button
                          key={day.day}
                          onClick={() => setSelectedDay(day.day)}
                          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                            selectedDay === day.day
                              ? `${colorClass} border-transparent text-white shadow-md`
                              : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm"
                          }`}
                        >
                          Day {day.day}
                        </button>
                      );
                    })}
                  </div>

                  {currentDay && (
                    <div className="space-y-3">
                      {/* Day header */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <h2 className="text-xl font-display font-bold text-slate-900 mb-2">
                          Day {currentDay.day}: {currentDay.title}
                        </h2>
                        <p className="text-slate-500 text-sm leading-relaxed">
                          {currentDay.description}
                        </p>
                      </div>

                      {/* Timeline of places */}
                      <div className="relative space-y-0">
                        {/* Timeline line */}
                        <div className="absolute left-9 top-0 bottom-0 w-px bg-slate-200" style={{ left: '36px' }} />

                        {currentDay.places?.map((place: Place, i: number) => (
                          <motion.div
                            key={place.id || i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => setSelectedPlace(place)}
                            className="relative flex gap-4 pb-3 cursor-pointer"
                          >
                            {/* Timeline dot */}
                            <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md ${
                              DAY_COLORS[(selectedDay - 1) % DAY_COLORS.length]
                            }`}>
                              {i + 1}
                            </div>

                            {/* Card */}
                            <div className={`flex-1 rounded-2xl border bg-white p-4 shadow-sm transition-all ${
                              selectedPlace?.id === place.id
                                ? "border-blue-300 bg-blue-50/50 shadow-md shadow-blue-100"
                                : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                            }`}>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${PLACE_TYPE_COLORS[place.type]}`}>
                                      {PLACE_TYPE_ICONS[place.type]}
                                      {place.type}
                                    </span>
                                    {place.duration && (
                                      <span className="flex items-center gap-1 text-xs text-slate-400">
                                        <Clock className="w-3 h-3" />
                                        {place.duration}
                                      </span>
                                    )}
                                    {place.rating && (
                                      <span className="text-xs text-amber-500 font-medium">
                                        ⭐ {place.rating}
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="font-semibold text-slate-900 text-base leading-tight">
                                    {place.name}
                                  </h3>
                                </div>
                                <a
                                  href={`https://www.openstreetmap.org/?mlat=${place.coordinates[0]}&mlon=${place.coordinates[1]}&zoom=16`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="View on OpenStreetMap"
                                >
                                  <Navigation className="w-4 h-4" />
                                </a>
                              </div>

                              <p className="text-slate-500 text-sm leading-relaxed mb-2">
                                {place.description}
                              </p>

                              {place.tips && (
                                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-2">
                                  💡 {place.tips}
                                </div>
                              )}

                              {place.address && (
                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {place.address}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Route info */}
                      {currentDay.routes && currentDay.routes.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-sm">
                            <Route className="w-4 h-4 text-blue-500" />
                            Day Routes
                          </h3>
                          <div className="space-y-2">
                            {currentDay.routes.map((route, i) => (
                              <div key={i} className="flex items-center gap-3 text-sm py-1.5 border-b border-slate-50 last:border-0">
                                <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                                <span className="text-slate-700 truncate flex-1">
                                  {route.from} → {route.to}
                                </span>
                                <span className="text-slate-400 shrink-0 text-xs">
                                  {route.distance} · {route.duration}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Day navigation */}
                      <div className="flex gap-3">
                        {selectedDay > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<ChevronLeft className="w-4 h-4" />}
                            onClick={() => setSelectedDay(selectedDay - 1)}
                          >
                            Day {selectedDay - 1}
                          </Button>
                        )}
                        {selectedDay < (trip.totalDays || 1) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<ChevronRight className="w-4 h-4" />}
                            iconPosition="right"
                            className="ml-auto"
                            onClick={() => setSelectedDay(selectedDay + 1)}
                          >
                            Day {selectedDay + 1}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {tab === "map" && (
                <motion.div
                  key="map"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[70vh] rounded-2xl overflow-hidden shadow-sm"
                >
                  <TripMap
                    trip={trip}
                    selectedDay={undefined}
                    onPlaceSelect={setSelectedPlace}
                    className="w-full h-full"
                  />
                </motion.div>
              )}

              {tab === "chat" && isOwner && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[70vh]"
                >
                  <ChatPanel
                    tripId={id}
                    trip={trip}
                    chatHistory={chatHistory}
                    onTripUpdate={handleTripUpdate}
                    onChatUpdate={setChatHistory}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right Sidebar ── */}
          <div className="space-y-4">
            {/* Map panel (always visible on itinerary/chat tab) */}
            {tab !== "map" && (
              <div className="rounded-2xl overflow-hidden shadow-sm" style={{ height: '260px' }}>
                <TripMap
                  trip={trip}
                  selectedDay={selectedDay}
                  onPlaceSelect={(place) => {
                    setSelectedPlace(place);
                    setTab("map");
                  }}
                  className="w-full h-full"
                />
              </div>
            )}

            {/* Trip Stats */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Trip Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <span className="text-xs text-slate-500 block mb-1">Duration</span>
                  <span className="text-slate-900 font-semibold">{trip.totalDays} days</span>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <span className="text-xs text-slate-500 block mb-1">Places</span>
                  <span className="text-slate-900 font-semibold">
                    {trip.days?.reduce((sum, d) => sum + (d.places?.length || 0), 0) || 0}
                  </span>
                </div>
                {trip.totalDistance && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <span className="text-xs text-slate-500 block mb-1">Distance</span>
                    <span className="text-slate-900 font-semibold">{trip.totalDistance}</span>
                  </div>
                )}
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <span className="text-xs text-slate-500 block mb-1">Budget</span>
                  <span className="text-slate-900 font-semibold capitalize">{trip.budget}</span>
                </div>
              </div>
            </div>

            {/* Selected place detail */}
            {selectedPlace && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 rounded-2xl border border-blue-200 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 text-sm flex-1">
                    {selectedPlace.name}
                  </h3>
                  <button
                    onClick={() => setSelectedPlace(null)}
                    className="text-slate-400 hover:text-slate-700 text-xs ml-2 p-1"
                  >
                    ✕
                  </button>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border mb-2 ${PLACE_TYPE_COLORS[selectedPlace.type]}`}>
                  {PLACE_TYPE_ICONS[selectedPlace.type]}
                  {selectedPlace.type}
                </span>
                <p className="text-slate-600 text-xs leading-relaxed mb-2">
                  {selectedPlace.description}
                </p>
                {selectedPlace.tips && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 mb-2">
                    💡 {selectedPlace.tips}
                  </div>
                )}
                <a
                  href={`https://www.openstreetmap.org/?mlat=${selectedPlace.coordinates[0]}&mlon=${selectedPlace.coordinates[1]}&zoom=16`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Navigation className="w-3 h-3" />
                  View on OpenStreetMap
                </a>
              </motion.div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
              {!isOwner && session && (
                <>
                  <Button
                    onClick={handleSave}
                    loading={saving}
                    variant={isSaved ? "ghost" : "primary"}
                    className="w-full"
                    size="sm"
                    icon={<Heart className={`w-4 h-4 ${isSaved ? "fill-red-400 text-red-400" : ""}`} />}
                  >
                    {isSaved ? "Saved" : "Save Trip"}
                  </Button>
                  <Button
                    onClick={handleClone}
                    loading={cloning}
                    variant="ghost"
                    className="w-full"
                    size="sm"
                    icon={<Copy className="w-4 h-4" />}
                  >
                    Clone & Customize
                  </Button>
                </>
              )}
              <Button
                onClick={shareTrip}
                variant="ghost"
                className="w-full"
                size="sm"
                icon={<Share2 className="w-4 h-4" />}
              >
                Share Trip
              </Button>
              {isOwner && (
                <Button
                  onClick={togglePublic}
                  loading={togglingPublic}
                  variant="ghost"
                  className="w-full"
                  size="sm"
                  icon={isPublic ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                >
                  {isPublic ? "Make Private" : "Make Public"}
                </Button>
              )}
            </div>

            {/* AI Insight panel */}
            <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">AI Insight</span>
              </div>
              <p className="text-sm text-blue-100 leading-relaxed mb-3">
                This trip covers {trip.days?.reduce((s, d) => s + (d.places?.length || 0), 0) || 0} places
                over {trip.totalDays} days.
                {trip.totalDistance && ` Total route: ${trip.totalDistance}.`}
                {" "}Chat with AI to refine any part of your itinerary!
              </p>
              {isOwner && (
                <button
                  onClick={() => setTab("chat")}
                  className="flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Open AI Chat
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
