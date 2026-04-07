"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Compass, Map, MessageSquare, Globe, ArrowRight,
  Sparkles, MapPin, Route, ChevronRight, Clock,
  Users, Search, Star,
} from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Button from "@/components/ui/Button";

/* ── Fade-up helper ── */
const FadeUp = ({
  children, delay = 0, className = "",
}: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const SUGGESTIONS = ["Bali, Indonesia", "Kyoto, Japan", "Santorini, Greece", "Paris, France", "New York, USA"];

const FEATURES = [
  {
    icon: <Sparkles className="w-5 h-5" />,
    label: "AI Trip Designer",
    title: "Describe your dream trip — AI handles the rest",
    desc: "Claude generates day-by-day itineraries with real GPS coordinates, restaurant picks, hidden viewpoints, and local tips tailored to your budget.",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-100",
    wide: true,
  },
  {
    icon: <Map className="w-5 h-5" />,
    label: "Live Map",
    title: "Every route on an interactive map",
    desc: "OpenStreetMap + OSRM routing draws real road paths between each stop with drive times.",
    color: "text-violet-600",
    bg: "bg-violet-50 border-violet-100",
    wide: false,
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    label: "Chat to Refine",
    title: "Swap a restaurant. Add a viewpoint. Just ask.",
    desc: "In-trip AI chat updates your itinerary in real time — no form to refill.",
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-100",
    wide: false,
  },
  {
    icon: <Globe className="w-5 h-5" />,
    label: "Share & Explore",
    title: "Publish, discover, clone any trip",
    desc: "Browse community trips worldwide. Bookmark favourites. Clone and customise as your own.",
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-100",
    wide: true,
  },
];

const STEPS = [
  {
    n: "01", color: "text-blue-500", bg: "bg-blue-50 border-blue-100",
    title: "Tell AI where you want to go",
    desc: "Enter destinations, budget, travel dates, and interests. A few fields — and you're done.",
  },
  {
    n: "02", color: "text-violet-500", bg: "bg-violet-50 border-violet-100",
    title: "Get a full itinerary instantly",
    desc: "Claude builds a day-by-day plan with real GPS pins, restaurant picks, viewpoints, and driving routes.",
  },
  {
    n: "03", color: "text-orange-500", bg: "bg-orange-50 border-orange-100",
    title: "Refine, visualize, share",
    desc: "Chat to adjust anything. View it on the map. Keep it private or publish to the community.",
  },
];

const DESTINATIONS = [
  { name: "Tokyo",      country: "Japan",     img: "tokyo+shibuya+japan+city",           days: 10 },
  { name: "Bali",       country: "Indonesia",  img: "bali+temple+tropical+indonesia",     days: 8  },
  { name: "Paris",      country: "France",     img: "paris+eiffel+tower+france",          days: 7  },
  { name: "Santorini",  country: "Greece",     img: "santorini+greece+blue+white",        days: 5  },
  { name: "New York",   country: "USA",        img: "new+york+city+manhattan+skyline",    days: 6  },
  { name: "Kyoto",      country: "Japan",      img: "kyoto+japan+temple+autumn",          days: 4  },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/trip/new?destination=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push("/trip/new");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1920&q=80"
          alt="Travel background"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1920&q=80";
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/60 to-slate-950/80" />
        <div className="dot-grid-dark absolute inset-0 opacity-20" />

        {/* Content */}
        <div className="relative z-10 mx-auto w-full max-w-4xl px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-300" />
            AI-Powered Travel Planning · Free Forever
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08 }}
            className="font-display mb-6 text-5xl font-bold leading-[1.1] text-white sm:text-6xl lg:text-7xl"
          >
            Your travel agency,
            <br />
            <span className="bg-gradient-to-r from-blue-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
              evolved.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mb-10 mx-auto max-w-xl text-lg leading-relaxed text-slate-300"
          >
            Describe where you want to go. Get a complete day-by-day itinerary
            with GPS routes, restaurants, and hidden gems — then refine through conversation.
          </motion.p>

          {/* Search bar */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.26 }}
            className="mx-auto mb-6 max-w-xl"
          >
            <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 p-2 backdrop-blur-sm">
              <Search className="ml-2 h-5 w-5 shrink-0 text-slate-300" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Where do you want to go?"
                className="flex-1 bg-transparent px-2 py-2 text-base text-white placeholder-slate-400 outline-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-blue-500 active:scale-95"
              >
                Plan Trip
              </button>
            </div>
          </motion.form>

          {/* Quick suggestions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-2"
          >
            <span className="text-sm text-slate-400">Try:</span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => router.push(`/trip/new?destination=${encodeURIComponent(s)}`)}
                className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-sm text-slate-200 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/15"
              >
                {s}
              </button>
            ))}
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mt-10 flex items-center justify-center gap-4 text-sm text-slate-400"
          >
            <div className="flex -space-x-2">
              {["#3b82f6","#8b5cf6","#f97316","#10b981"].map((c, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: c }}
                >
                  {["A","J","M","S"][i]}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span>Travelers planning smarter with AI</span>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="flex h-10 w-6 items-start justify-center rounded-full border border-white/30 pt-2"
          >
            <div className="h-1.5 w-1 rounded-full bg-white/60" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────── */}
      <div className="bg-white border-y border-slate-100 py-10">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
            {[
              { value: "100%", label: "Free maps & routing" },
              { value: "Claude", label: "AI-powered plans" },
              { value: "OSRM",   label: "Real road navigation" },
              { value: "OSM",    label: "OpenStreetMap data" },
            ].map((s, i) => (
              <div key={i} className="bg-white py-6 text-center">
                <div className="gradient-text-blue text-2xl font-bold mb-1">{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features bento grid ───────────────────────────────────────── */}
      <section className="py-24 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6">
          <FadeUp className="mb-14 text-center">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Features</p>
            <h2 className="font-display text-4xl font-bold text-slate-900 mb-4">
              Everything for the modern traveler
            </h2>
            <p className="mx-auto max-w-md text-slate-500">
              AI-generated routes, interactive maps, community sharing — all in one place, all free.
            </p>
          </FadeUp>

          <div className="grid gap-4 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <FadeUp
                key={i}
                delay={i * 0.07}
                className={f.wide ? "md:col-span-2" : "md:col-span-1"}
              >
                <div className="glass-card h-full rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
                  <div className={`inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold ${f.bg} ${f.color}`}>
                    {f.icon}
                    {f.label}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 leading-snug">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <FadeUp className="mb-16 text-center">
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="font-display text-4xl font-bold text-slate-900">
              Plan a trip in{" "}
              <span className="gradient-text">three steps</span>
            </h2>
          </FadeUp>

          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <FadeUp key={i} delay={i * 0.12}>
                <div className={`rounded-2xl border p-6 ${s.bg}`}>
                  <div className={`mb-4 text-6xl font-black ${s.color} opacity-20 font-display leading-none select-none`}>
                    {s.n}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{s.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular destinations ──────────────────────────────────────── */}
      <section className="py-24 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6">
          <FadeUp className="mb-12 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600 uppercase tracking-widest mb-2">Inspiration</p>
              <h2 className="font-display text-4xl font-bold text-slate-900">
                Popular <span className="gradient-text">destinations</span>
              </h2>
            </div>
            <Link href="/trip/new">
              <Button variant="ghost" size="sm" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                Plan your own
              </Button>
            </Link>
          </FadeUp>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {DESTINATIONS.map((d, i) => (
              <FadeUp key={i} delay={i * 0.07}>
                <Link href={`/trip/new?destination=${encodeURIComponent(d.name + ', ' + d.country)}`}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    className="group relative overflow-hidden rounded-2xl cursor-pointer h-52"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80`}
                      alt={d.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          `https://picsum.photos/seed/${encodeURIComponent(d.name)}/600/400`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="font-bold text-white text-base leading-tight">{d.name}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-300">
                        <MapPin className="w-3 h-3" />
                        <span>{d.country}</span>
                        <span className="ml-auto flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {d.days}d
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                        Plan this <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <FadeUp>
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-violet-600 to-blue-700 p-12 shadow-2xl shadow-blue-500/20">
              <div className="dot-grid-dark absolute inset-0 opacity-20" />
              <div className="relative z-10">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                  <Compass className="h-7 w-7 text-white" />
                </div>
                <h2 className="font-display mb-4 text-4xl font-bold text-white">
                  Ready for your next adventure?
                </h2>
                <p className="mb-8 text-lg text-blue-100 max-w-md mx-auto">
                  Free to start. No credit card. Just tell AI where you want to go
                  and get a complete itinerary in seconds.
                </p>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/register">
                    <button className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-600 shadow-lg transition-all hover:bg-blue-50 active:scale-95">
                      Start Planning Free
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </Link>
                  <Link href="/explore">
                    <button className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20">
                      <Users className="h-5 w-5" />
                      See Community Trips
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-md shadow-blue-500/20">
                <Compass className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-lg font-bold text-slate-900">
                Trip<span className="text-blue-600">Go</span>
              </span>
              <span className="text-xs text-slate-400 border border-slate-200 rounded-full px-2 py-0.5 ml-1">Beta</span>
            </div>

            <nav className="flex flex-wrap gap-6 text-sm">
              {[
                { href: "/explore",  label: "Explore Trips" },
                { href: "/trip/new", label: "Plan a Trip" },
                { href: "/login",    label: "Sign In" },
                { href: "/register", label: "Get Started" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="text-slate-500 hover:text-slate-900 transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>

            <p className="text-xs text-slate-400">
              Maps by <span className="text-slate-600">OpenStreetMap</span> ·{" "}
              AI by <span className="text-slate-600">qwen3.6-plus</span> ·{" "}
              © {new Date().getFullYear()} TripGo
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
