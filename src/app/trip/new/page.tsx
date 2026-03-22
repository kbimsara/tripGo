"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Plus, X, Sparkles, Clock, DollarSign,
  Users, Calendar, ArrowRight,
} from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Button from "@/components/ui/Button";
import Link from "next/link";

const INTERESTS = [
  "History & Culture", "Nature & Hiking", "Food & Cuisine", "Art & Museums",
  "Adventure Sports", "Beach & Relaxation", "Shopping", "Nightlife",
  "Photography", "Architecture", "Local Markets", "Spiritual Sites",
];

const BUDGETS = [
  { value: "budget",   label: "Budget",   desc: "Hostels, street food", icon: "💰" },
  { value: "moderate", label: "Moderate", desc: "Mid-range hotels & dining", icon: "💳" },
  { value: "luxury",   label: "Luxury",   desc: "Premium hotels & fine dining", icon: "💎" },
];

/* ── Reusable section label ── */
function SectionLabel({ icon, text, optional }: { icon: React.ReactNode; text: string; optional?: boolean }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-blue-400">{icon}</span>
      <span className="text-sm font-semibold text-white">{text}</span>
      {optional && <span className="ml-1 text-xs text-slate-500">(optional)</span>}
    </div>
  );
}

export default function NewTripPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [destinations, setDestinations] = useState<string[]>(["", ""]);
  const [days, setDays] = useState(5);
  const [budget, setBudget] = useState<"budget" | "moderate" | "luxury">("moderate");
  const [interests, setInterests] = useState<string[]>([]);
  const [travelers, setTravelers] = useState(2);
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  const addDest = () => destinations.length < 5 && setDestinations([...destinations, ""]);
  const removeDest = (i: number) => setDestinations(destinations.filter((_, idx) => idx !== i));
  const updateDest = (i: number, val: string) => {
    const next = [...destinations];
    next[i] = val;
    setDestinations(next);
  };
  const toggleInterest = (v: string) =>
    setInterests((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);

  const Counter = ({ value, onChange, min = 1, max = 30 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) => (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 text-lg leading-none"
      >
        −
      </button>
      <span className="w-8 text-center text-xl font-bold text-white">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 text-lg leading-none"
      >
        +
      </button>
    </div>
  );

  const handleGenerate = async () => {
    if (!session) { router.push("/login"); return; }
    const validDests = destinations.filter((d) => d.trim());
    if (!validDests.length) { setError("Enter at least one destination"); return; }

    setLoading(true);
    setError("");
    setGenerating(true);

    try {
      const genRes = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinations: validDests, days, budget,
          interests: interests.length ? interests : ["General sightseeing"],
          travelers,
          startDate: startDate || undefined,
          notes: notes || undefined,
        }),
      });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error || "Failed to generate trip");

      const saveRes = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...genData.trip, destinations: validDests, totalDays: days, budget, isPublic: false,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || "Failed to save trip");

      router.push(`/trip/${saveData.trip._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setGenerating(false);
    } finally {
      setLoading(false);
    }
  };

  /* ── Generating screen ── */
  if (generating && loading) {
    return (
      <div className="animated-gradient flex min-h-screen flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-2xl shadow-blue-500/30"
        >
          <Sparkles className="h-10 w-10 text-white" />
        </motion.div>
        <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="mb-2 text-2xl font-bold text-white">
          Designing Your Trip
        </h2>
        <p className="mb-8 text-slate-400">Claude AI is crafting your perfect itinerary…</p>
        <div className="flex flex-col items-start gap-2 text-sm text-slate-500">
          {["Finding best attractions…", "Planning optimal routes…", "Discovering hidden gems…", "Adding local tips…"].map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 2 }} className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              {msg}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animated-gradient min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 pb-20 pt-24 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300">
            <Sparkles className="h-4 w-4" />
            AI-Powered Trip Planner
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="mb-2 text-4xl font-bold text-white">
            Plan Your Perfect Trip
          </h1>
          <p className="text-slate-400">Tell Claude AI about your dream trip</p>
        </motion.div>

        {/* Sign-in nudge */}
        {!session && (
          <div className="mb-6 rounded-xl border border-yellow-500/20 bg-yellow-500/8 px-4 py-3 text-center text-sm text-yellow-400">
            <Link href="/login" className="font-medium underline">Sign in</Link> to save your AI-generated trip plan
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl border border-white/10 p-6 sm:p-8"
        >
          <div className="space-y-8">

            {/* ── Destinations ── */}
            <div>
              <SectionLabel icon={<MapPin className="h-4 w-4" />} text="Where do you want to go?" />
              <div className="space-y-2">
                <AnimatePresence>
                  {destinations.map((dest, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="flex gap-2"
                    >
                      <input
                        value={dest}
                        onChange={(e) => updateDest(i, e.target.value)}
                        placeholder={i === 0 ? "e.g. Paris, France" : "Add another destination"}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                      />
                      {destinations.length > 1 && (
                        <button
                          onClick={() => removeDest(i)}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-500 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {destinations.length < 5 && (
                  <button
                    onClick={addDest}
                    className="mt-1 flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add destination
                  </button>
                )}
              </div>
            </div>

            {/* ── Duration + Travelers ── */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <SectionLabel icon={<Clock className="h-4 w-4" />} text="Days" />
                <Counter value={days} onChange={setDays} max={30} />
              </div>
              <div>
                <SectionLabel icon={<Users className="h-4 w-4" />} text="Travelers" />
                <Counter value={travelers} onChange={setTravelers} max={20} />
              </div>
            </div>

            {/* ── Budget ── */}
            <div>
              <SectionLabel icon={<DollarSign className="h-4 w-4" />} text="Budget Level" />
              <div className="grid grid-cols-3 gap-3">
                {BUDGETS.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => setBudget(b.value as typeof budget)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      budget === b.value
                        ? "border-blue-500 bg-blue-500/15 text-white"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <div className="mb-1.5 text-xl">{b.icon}</div>
                    <div className="text-sm font-medium">{b.label}</div>
                    <div className="mt-0.5 text-xs opacity-60 leading-tight">{b.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Interests ── */}
            <div>
              <SectionLabel icon={<Sparkles className="h-4 w-4" />} text="Interests" optional />
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleInterest(v)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                      interests.includes(v)
                        ? "border-blue-500 bg-blue-500/20 text-blue-300"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Start date ── */}
            <div>
              <SectionLabel icon={<Calendar className="h-4 w-4" />} text="Start Date" optional />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 [color-scheme:dark]"
              />
            </div>

            {/* ── Notes ── */}
            <div>
              <SectionLabel icon={<ArrowRight className="h-4 w-4" />} text="Special Requests" optional />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Wheelchair accessible, vegetarian restaurants, pet-friendly…"
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400"
              >
                {error}
              </motion.p>
            )}

            {/* Generate */}
            <Button
              onClick={handleGenerate}
              loading={loading}
              size="lg"
              className="w-full text-base"
              icon={<Sparkles className="h-5 w-5" />}
            >
              Generate My Trip with AI
            </Button>

            <p className="text-center text-xs text-slate-600">
              Claude AI creates a complete itinerary with GPS routes, viewpoints, and local tips
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
