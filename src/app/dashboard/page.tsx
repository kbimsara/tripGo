"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Globe, Lock, Map, Clock, Sparkles, Trash2, TrendingUp } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import TripCard from "@/components/trip/TripCard";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { Trip } from "@/types";

const STATS_CONFIG = [
  { key: "total",     label: "Total Trips",   icon: <Map className="h-5 w-5" />,         color: "bg-blue-50 text-blue-600 border-blue-100"    },
  { key: "public",    label: "Public",        icon: <Globe className="h-5 w-5" />,       color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { key: "private",   label: "Private",       icon: <Lock className="h-5 w-5" />,        color: "bg-violet-50 text-violet-600 border-violet-100" },
  { key: "totalDays", label: "Days Planned",  icon: <Clock className="h-5 w-5" />,       color: "bg-orange-50 text-orange-600 border-orange-100" },
];

function SkeletonCard() {
  return <div className="h-72 rounded-2xl bg-slate-100 shimmer" />;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/trips")
      .then((r) => r.json())
      .then((d) => { setTrips(d.trips || []); setLoading(false); });
  }, [session]);

  const stats = {
    total:     trips.length,
    public:    trips.filter((t) => t.isPublic).length,
    private:   trips.filter((t) => !t.isPublic).length,
    totalDays: trips.reduce((sum, t) => sum + (t.totalDays || 0), 0),
  };

  const handleDelete = async (tripId: string) => {
    if (!confirm("Delete this trip permanently?")) return;
    setDeleting(tripId);
    await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
    setTrips((prev) => prev.filter((t) => t._id !== tripId));
    setDeleting(null);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-7xl px-6 pt-24">
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl shimmer bg-slate-100" />)}
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900 mb-1">
              My Trips
            </h1>
            <p className="text-slate-500">
              {trips.length > 0
                ? `You have ${trips.length} adventure${trips.length !== 1 ? "s" : ""} planned.`
                : "Start planning your first adventure!"}
            </p>
          </div>
          <Link href="/trip/new">
            <Button size="lg" icon={<Plus className="h-5 w-5" />} className="shadow-lg shadow-blue-500/20">
              Start New Trip
            </Button>
          </Link>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {STATS_CONFIG.map((s) => (
            <div key={s.key} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${s.color}`}>
                {s.icon}
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {stats[s.key as keyof typeof stats]}
              </div>
              <div className="mt-0.5 text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* ── Trips ── */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : trips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50">
              <Sparkles className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-900">No trips yet</h3>
            <p className="mb-8 max-w-xs text-slate-500">
              Let AI design your first perfect trip. Just tell us where you want to go!
            </p>
            <Link href="/trip/new">
              <Button size="lg" icon={<Sparkles className="h-5 w-5" />}>Plan My First Trip</Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {trips.map((trip, i) => (
              <motion.div
                key={trip._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group relative"
              >
                <TripCard trip={trip} />
                {/* Delete button */}
                <button
                  onClick={() => handleDelete(trip._id)}
                  disabled={deleting === trip._id}
                  title="Delete trip"
                  className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-red-500 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 hover:bg-red-600 disabled:cursor-wait"
                >
                  {deleting === trip._id
                    ? <div className="h-3.5 w-3.5 animate-spin rounded-full border border-white/30 border-t-white" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </motion.div>
            ))}

            {/* New trip placeholder card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: trips.length * 0.04 }}
            >
              <Link href="/trip/new">
                <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center transition-all hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer group shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 transition-transform group-hover:scale-110">
                    <Plus className="h-7 w-7 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">New Trip</p>
                    <p className="mt-1 text-sm text-slate-500">Plan with AI</p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Surprise Me card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (trips.length + 1) * 0.04 }}
            >
              <Link href="/explore">
                <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center transition-all hover:border-violet-300 hover:bg-violet-50/50 cursor-pointer group shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 transition-transform group-hover:scale-110">
                    <TrendingUp className="h-7 w-7 text-violet-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Explore Trips</p>
                    <p className="mt-1 text-sm text-slate-500">Browse community</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        )}
      </div>

      {/* ── Floating AI Assistant ── */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link href="/trip/new">
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: "spring", bounce: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-500/30 transition-shadow hover:shadow-2xl hover:shadow-blue-500/40"
          >
            <Sparkles className="h-4 w-4" />
            AI Assistant
          </motion.button>
        </Link>
      </div>
    </div>
  );
}
