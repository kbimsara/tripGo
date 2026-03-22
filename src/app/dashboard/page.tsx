"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Globe, Lock, Map, Clock, Sparkles, Trash2 } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import TripCard from "@/components/trip/TripCard";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { Trip } from "@/types";

const STATS_CONFIG = [
  { key: "total",     label: "Total Trips",   icon: <Map className="h-5 w-5" />,   color: "from-blue-500 to-blue-600"    },
  { key: "public",    label: "Public",        icon: <Globe className="h-5 w-5" />, color: "from-emerald-500 to-emerald-600" },
  { key: "private",   label: "Private",       icon: <Lock className="h-5 w-5" />,  color: "from-violet-500 to-violet-600" },
  { key: "totalDays", label: "Days Planned",  icon: <Clock className="h-5 w-5" />, color: "from-orange-500 to-orange-600" },
];

function SkeletonCard() {
  return <div className="h-72 rounded-2xl bg-white/5 shimmer" />;
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
      <div className="animated-gradient min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-7xl px-6 pt-24">
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl shimmer bg-white/5" />)}
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animated-gradient min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-2xl font-bold text-white shadow-lg shadow-blue-500/20">
              {session?.user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1
                style={{ fontFamily: "'Playfair Display', serif" }}
                className="text-2xl font-bold text-white"
              >
                My Trips
              </h1>
              <p className="text-sm text-slate-400">{session?.user?.email}</p>
            </div>
          </div>
          <Link href="/trip/new">
            <Button size="lg" icon={<Plus className="h-5 w-5" />} className="shadow-lg shadow-blue-500/20">
              New Trip
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
            <div key={s.key} className="glass rounded-2xl border border-white/8 p-5">
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow`}>
                {s.icon}
              </div>
              <div className="text-2xl font-bold text-white">
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
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
              <Sparkles className="h-10 w-10 text-blue-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">No trips yet</h3>
            <p className="mb-8 max-w-xs text-slate-400">
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
                {/* Delete overlay */}
                <button
                  onClick={() => handleDelete(trip._id)}
                  disabled={deleting === trip._id}
                  title="Delete trip"
                  className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/80 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500 disabled:cursor-wait"
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
                <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-white/10 p-8 text-center transition-all hover:border-blue-500/40 hover:bg-blue-500/5 cursor-pointer group">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 transition-transform group-hover:scale-110">
                    <Plus className="h-7 w-7 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">New Trip</p>
                    <p className="mt-1 text-sm text-slate-500">Plan with AI</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
