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
  Users,
  DollarSign,
  Loader2,
  Trash2,
  Edit3,
} from "lucide-react";
import dynamic from "next/dynamic";
import Navbar from "@/components/ui/Navbar";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import ChatPanel from "@/components/chat/ChatPanel";
import { Trip, Place, ChatMessage, Day } from "@/types";
import { formatDate, getImageUrl } from "@/lib/utils";

// Dynamic import to avoid SSR issues with Leaflet
const TripMap = dynamic(() => import("@/components/map/TripMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-800/50 rounded-2xl flex items-center justify-center">
      <div className="text-slate-400 flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading map...
      </div>
    </div>
  ),
});

const PLACE_TYPE_ICONS: Record<Place["type"], React.ReactNode> = {
  destination: <MapPin className="w-4 h-4" />,
  viewpoint: <Eye className="w-4 h-4" />,
  restaurant: <Coffee className="w-4 h-4" />,
  hotel: <Hotel className="w-4 h-4" />,
  activity: <Zap className="w-4 h-4" />,
};

const PLACE_TYPE_COLORS: Record<Place["type"], string> = {
  destination: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  viewpoint: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  restaurant: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  hotel: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  activity: "text-red-400 bg-red-500/10 border-red-500/20",
};

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
        setIsSaved(
          data.trip.savedBy?.includes(session?.user?.id || "") || false
        );
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
      <div className="min-h-screen animated-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your trip...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen animated-gradient flex items-center justify-center">
        <div className="text-center glass p-8 rounded-2xl">
          <p className="text-red-400 mb-4">{error || "Trip not found"}</p>
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
      600
    );

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative h-72 sm:h-80 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImage}
          alt={trip.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://source.unsplash.com/1200x600/?travel`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium glass ${
                  isPublic ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {isPublic ? "Public" : "Private"}
              </div>
              {trip.tags?.slice(0, 3).map((tag) => (
                <div
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs glass text-slate-300"
                >
                  {tag}
                </div>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2 drop-shadow-xl">
              {trip.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-400" />
                {trip.destinations?.join(" → ")}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-400" />
                {trip.totalDays} days
              </div>
              {trip.budget && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                  {trip.budget}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-orange-400" />
                {formatDate(trip.createdAt)}
              </div>
              {trip.saves > 0 && (
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 fill-red-400 text-red-400" />
                  {trip.saves} saves
                </div>
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
                className="p-2.5 glass rounded-xl text-slate-300 hover:text-white transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-48 glass rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50"
                  >
                    <button
                      onClick={togglePublic}
                      disabled={togglingPublic}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 text-left"
                    >
                      {isPublic ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                      {isPublic ? "Make Private" : "Make Public"}
                    </button>
                    <button
                      onClick={shareTrip}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 text-left"
                    >
                      <Share2 className="w-4 h-4" />
                      Copy Link
                    </button>
                    <button
                      onClick={deleteTrip}
                      disabled={deleting}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 text-left"
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
                  className="p-2.5 glass rounded-xl text-slate-300 hover:text-white transition-colors"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isSaved ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
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

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {/* Owner info */}
        <div className="flex items-center gap-3 py-4 border-b border-white/5 mb-6">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
            {(trip.owner as { name: string })?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {(trip.owner as { name: string })?.name}
            </p>
            <p className="text-xs text-slate-500">Trip creator</p>
          </div>
          {trip.originalTrip && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 glass px-3 py-1.5 rounded-full">
              <Copy className="w-3 h-3" />
              Cloned trip
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 glass rounded-xl mb-6 w-fit">
          {[
            { id: "itinerary" as Tab, icon: <List className="w-4 h-4" />, label: "Itinerary" },
            { id: "map" as Tab, icon: <Map className="w-4 h-4" />, label: "Map" },
            { id: "chat" as Tab, icon: <MessageSquare className="w-4 h-4" />, label: "AI Chat", ownerOnly: true },
          ]
            .filter((t) => !t.ownerOnly || isOwner)
            .map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t.icon}
                {t.label}
                {t.id === "chat" && chatHistory.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-blue-400/20 text-blue-300 text-xs flex items-center justify-center">
                    {chatHistory.filter((m) => m.role === "user").length}
                  </span>
                )}
              </button>
            ))}
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {tab === "itinerary" && (
                <motion.div
                  key="itinerary"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {/* Day selector */}
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
                    {trip.days?.map((day) => (
                      <button
                        key={day.day}
                        onClick={() => setSelectedDay(day.day)}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                          selectedDay === day.day
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        Day {day.day}
                      </button>
                    ))}
                  </div>

                  {currentDay && (
                    <div className="space-y-4">
                      {/* Day header */}
                      <div className="glass rounded-2xl p-5 border border-white/5">
                        <h2 className="text-xl font-display font-bold text-white mb-2">
                          Day {currentDay.day}: {currentDay.title}
                        </h2>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          {currentDay.description}
                        </p>
                      </div>

                      {/* Places */}
                      {currentDay.places?.map((place: Place, i: number) => (
                        <motion.div
                          key={place.id || i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => setSelectedPlace(place)}
                          className={`glass rounded-2xl p-5 border cursor-pointer transition-all ${
                            selectedPlace?.id === place.id
                              ? "border-blue-500/50 bg-blue-500/5"
                              : "border-white/5 hover:border-white/15"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Index badge */}
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                              {i + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <h3 className="font-semibold text-white text-base">
                                    {place.name}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span
                                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
                                        PLACE_TYPE_COLORS[place.type]
                                      }`}
                                    >
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
                                      <span className="text-xs text-yellow-400">
                                        ⭐ {place.rating}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <a
                                  href={`https://www.openstreetmap.org/?mlat=${place.coordinates[0]}&mlon=${place.coordinates[1]}&zoom=16`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-2 text-slate-500 hover:text-blue-400 transition-colors flex-shrink-0"
                                  title="View on OpenStreetMap"
                                >
                                  <Navigation className="w-4 h-4" />
                                </a>
                              </div>

                              <p className="text-slate-400 text-sm leading-relaxed mb-3">
                                {place.description}
                              </p>

                              {place.tips && (
                                <div className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                                  💡 {place.tips}
                                </div>
                              )}

                              {place.address && (
                                <p className="text-xs text-slate-600 mt-2 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {place.address}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {/* Route info */}
                      {currentDay.routes && currentDay.routes.length > 0 && (
                        <div className="glass rounded-2xl p-5 border border-white/5">
                          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-blue-400" />
                            Day Routes
                          </h3>
                          <div className="space-y-3">
                            {currentDay.routes.map((route, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-3 text-sm"
                              >
                                <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                                <span className="text-slate-300 truncate">
                                  {route.from} → {route.to}
                                </span>
                                <span className="text-slate-500 ml-auto flex-shrink-0">
                                  {route.distance} · {route.duration}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Day nav */}
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
                  className="h-[70vh] rounded-2xl overflow-hidden"
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

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Mini Map (always visible on itinerary/chat tab) */}
            {tab !== "map" && (
              <div className="h-64 rounded-2xl overflow-hidden">
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
            <div className="glass rounded-2xl p-5 border border-white/5 space-y-3">
              <h3 className="font-semibold text-white text-sm">Trip Stats</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500 text-xs">Duration</span>
                  <span className="text-white font-medium">{trip.totalDays} days</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500 text-xs">Places</span>
                  <span className="text-white font-medium">
                    {trip.days?.reduce((sum, d) => sum + (d.places?.length || 0), 0) || 0}
                  </span>
                </div>
                {trip.totalDistance && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 text-xs">Distance</span>
                    <span className="text-white font-medium">{trip.totalDistance}</span>
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500 text-xs">Budget</span>
                  <span className="text-white font-medium capitalize">{trip.budget}</span>
                </div>
              </div>
            </div>

            {/* Selected place detail */}
            {selectedPlace && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-5 border border-blue-500/20 bg-blue-500/5"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white text-sm flex-1">
                    {selectedPlace.name}
                  </h3>
                  <button
                    onClick={() => setSelectedPlace(null)}
                    className="text-slate-500 hover:text-white text-xs ml-2"
                  >
                    ✕
                  </button>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border mb-2 ${
                    PLACE_TYPE_COLORS[selectedPlace.type]
                  }`}
                >
                  {PLACE_TYPE_ICONS[selectedPlace.type]}
                  {selectedPlace.type}
                </span>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {selectedPlace.description}
                </p>
                {selectedPlace.tips && (
                  <div className="mt-2 text-xs text-yellow-400">
                    💡 {selectedPlace.tips}
                  </div>
                )}
                <a
                  href={`https://www.openstreetmap.org/?mlat=${selectedPlace.coordinates[0]}&mlon=${selectedPlace.coordinates[1]}&zoom=16`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
                >
                  <Navigation className="w-3 h-3" />
                  View on OpenStreetMap
                </a>
              </motion.div>
            )}

            {/* Actions */}
            <div className="glass rounded-2xl p-4 border border-white/5 space-y-2">
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
          </div>
        </div>
      </div>
    </div>
  );
}
