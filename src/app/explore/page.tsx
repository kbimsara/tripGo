"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Globe, TrendingUp, Clock, Sparkles } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import TripCard from "@/components/trip/TripCard";
import Button from "@/components/ui/Button";
import { Trip } from "@/types";
import { useSession } from "next-auth/react";

const TAGS = [
  "All", "cultural", "adventure", "beach", "nature", "city",
  "food", "history", "photography", "budget", "luxury", "family",
];

const SORT_OPTIONS = [
  { value: "recent",  label: "Most Recent",  icon: <Clock className="h-4 w-4" /> },
  { value: "popular", label: "Most Popular", icon: <TrendingUp className="h-4 w-4" /> },
  { value: "oldest",  label: "Oldest First", icon: <Globe className="h-4 w-4" /> },
];

function SkeletonCard() {
  return <div className="h-72 rounded-2xl bg-slate-100 shimmer" />;
}

export default function ExplorePage() {
  const { data: session } = useSession();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showSort, setShowSort] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchTrips = useCallback(async (reset = false) => {
    setLoading(true);
    const p = reset ? 1 : page;
    const params = new URLSearchParams({
      sort, page: p.toString(),
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(selectedTag !== "All" && { tag: selectedTag }),
    });
    const res = await fetch(`/api/trips/public?${params}`);
    const data = await res.json();
    if (data.trips) {
      setTrips(reset ? data.trips : (prev) => [...prev, ...data.trips]);
      setTotalPages(data.pagination.pages);
      if (reset) setPage(1);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedTag, sort, page]);

  useEffect(() => { fetchTrips(true); }, [debouncedSearch, selectedTag, sort]); // eslint-disable-line

  const handleSave = async (tripId: string) => {
    await fetch(`/api/trips/${tripId}/save`, { method: "POST" });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* ── Hero ── */}
      <div className="bg-white border-b border-slate-100 pb-10 pt-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm text-blue-600 font-medium">
              <Globe className="h-4 w-4" />
              Community Trips
            </div>
            <h1
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              className="mb-3 text-4xl font-bold text-slate-900 sm:text-5xl"
            >
              Explore <span className="gradient-text">Shared Trips</span>
            </h1>
            <p className="mb-8 text-slate-500">
              Discover AI-crafted itineraries shared by travelers worldwide. Save favorites or clone any trip as your own.
            </p>

            {/* Search bar */}
            <div className="relative mx-auto max-w-lg">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search destinations, tags..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-slate-900 placeholder-slate-400 outline-none shadow-sm transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6">

        {/* ── Filters row ── */}
        <div className="mb-8 flex items-center gap-3">
          {/* Scrollable tag pills */}
          <div className="scrollbar-none flex flex-1 gap-2 overflow-x-auto pb-1">
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  selectedTag === tag
                    ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600 shadow-sm"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowSort(!showSort)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:border-slate-300 shadow-sm"
            >
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />
              <span className="hidden sm:inline">{SORT_OPTIONS.find((s) => s.value === sort)?.label}</span>
            </button>
            {showSort && (
              <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSort(opt.value); setShowSort(false); }}
                    className={`flex w-full items-center gap-2.5 px-4 py-3 text-sm transition-colors ${
                      sort === opt.value
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Results ── */}
        {loading && trips.length === 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Globe className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">No trips found</h3>
            <p className="mb-6 text-sm text-slate-500">
              {search ? `No results for "${search}"` : "Be the first to share a trip!"}
            </p>
            <Button onClick={() => { setSearch(""); setSelectedTag("All"); }} variant="ghost">
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-5 text-sm text-slate-500">{trips.length} community trips</p>
            <div className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {trips.map((trip, i) => (
                <motion.div
                  key={trip._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i % 8) * 0.04 }}
                  className="h-full"
                >
                  <TripCard
                    trip={trip}
                    showOwner
                    onSave={session ? handleSave : undefined}
                    isSaved={trip.savedBy?.includes(session?.user?.id || "")}
                  />
                </motion.div>
              ))}
            </div>

            {page < totalPages && (
              <div className="mt-12 text-center">
                <Button
                  onClick={() => { setPage((p) => p + 1); fetchTrips(false); }}
                  loading={loading}
                  variant="ghost"
                  size="lg"
                  icon={<Sparkles className="h-4 w-4" />}
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
