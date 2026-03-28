"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Compass,
  Map,
  MessageSquare,
  Globe,
  ArrowRight,
  Star,
  Sparkles,
  Users,
  Shield,
  Zap,
  ChevronDown,
  MapPin,
} from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Button from "@/components/ui/Button";

const FEATURES = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "AI Trip Designer",
    desc: "Claude AI generates personalized itineraries with real GPS coordinates, viewpoints, restaurants, and travel tips.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: <Map className="w-6 h-6" />,
    title: "Interactive Map",
    desc: "Visualize your entire trip on a free OpenStreetMap-powered map with color-coded day routes and custom markers.",
    color: "from-violet-500 to-violet-600",
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Chat to Customize",
    desc: "Refine your itinerary through natural conversation. Add viewpoints, swap restaurants, change routes — just ask.",
    color: "from-orange-500 to-orange-600",
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Share & Discover",
    desc: "Publish your trips publicly, explore others' plans, and clone any trip as your own starting point.",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Community Plans",
    desc: "Browse thousands of community-created itineraries, save favorites, and build on existing inspiration.",
    color: "from-pink-500 to-pink-600",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Your Account",
    desc: "Save all your trips securely. Control privacy per trip — keep it private or share with the world.",
    color: "from-cyan-500 to-cyan-600",
  },
];

const DESTINATIONS = [
  { name: "Paris, France",    image: "paris,eiffel,sunset",    days: 7,  rating: 4.9 },
  { name: "Tokyo, Japan",     image: "tokyo,shibuya,night",    days: 10, rating: 4.8 },
  { name: "Santorini, Greece",image: "santorini,greece,white", days: 5,  rating: 4.9 },
  { name: "Bali, Indonesia",  image: "bali,temple,tropical",   days: 8,  rating: 4.7 },
];

const STATS = [
  { value: "10K+",     label: "Trips Planned" },
  { value: "50+",      label: "Countries" },
  { value: "100%",     label: "Free Maps" },
  { value: "Claude",   label: "AI Powered" },
];

const STEPS = [
  {
    step: "01",
    title: "Choose Destinations",
    desc: "Enter your destinations, travel dates, budget, and interests.",
    icon: <MapPin className="w-7 h-7" />,
    color: "text-blue-400",
    ring: "ring-blue-500/30 bg-blue-500/10",
  },
  {
    step: "02",
    title: "AI Plans Your Trip",
    desc: "Claude AI generates a complete day-by-day itinerary with GPS routes and viewpoints.",
    icon: <Sparkles className="w-7 h-7" />,
    color: "text-violet-400",
    ring: "ring-violet-500/30 bg-violet-500/10",
  },
  {
    step: "03",
    title: "Customize & Share",
    desc: "Refine via chat, visualize on the map, then save privately or share publicly.",
    icon: <Globe className="w-7 h-7" />,
    color: "text-orange-400",
    ring: "ring-orange-500/30 bg-orange-500/10",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen animated-gradient">
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
        {/* Ambient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="anim-float absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
          <div className="anim-float-delay-2 absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-violet-600/15 blur-3xl" />
          <div className="anim-float-delay-4 absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/8 blur-3xl" />
          {/* Dot grid */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-4xl px-6 text-center">
          {/* Badge — always visible, just slides up */}
          <motion.div
            initial={{ opacity: 1, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300"
          >
            <Sparkles className="h-4 w-4" />
            Powered by Claude AI · Free OpenStreetMap
            <Zap className="h-4 w-4 text-yellow-400" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 1, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            className="mb-6 text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl"
          >
            Plan Your Perfect
            <br />
            <span className="gradient-text">Trip with AI</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 1, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-slate-400"
          >
            Tell us where you want to go. AI designs your itinerary with
            directions, viewpoints, and hidden gems — then customize through
            natural conversation.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 1, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="mb-14 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/trip/new">
              <Button size="lg" icon={<Sparkles className="h-5 w-5" />} className="shadow-2xl shadow-blue-500/20">
                Plan My Trip Now
              </Button>
            </Link>
            <Link href="/explore">
              <Button size="lg" variant="ghost" icon={<Globe className="h-5 w-5" />}>
                Explore Trips
              </Button>
            </Link>
          </motion.div>

          {/* Stats row */}
          <div className="mx-auto grid max-w-lg grid-cols-2 gap-3 sm:max-w-2xl sm:grid-cols-4">
            {STATS.map((s, i) => (
              <div
                key={i}
                className="glass rounded-2xl border border-white/10 py-4 text-center"
              >
                <div className="gradient-text text-2xl font-bold">{s.value}</div>
                <div className="mt-1 text-xs text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-500"
        >
          <ChevronDown className="h-6 w-6" />
        </motion.div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <h2
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              className="mb-4 text-4xl font-bold text-white"
            >
              Everything You Need to{" "}
              <span className="gradient-text">Travel Smart</span>
            </h2>
            <p className="mx-auto max-w-md text-slate-400">
              From AI-generated routes to community sharing — TripGo has every
              tool for the modern traveler.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="glass flex flex-col gap-4 rounded-2xl border border-white/8 p-6 transition-colors hover:border-white/16"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-lg`}
                >
                  {f.icon}
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-400">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              className="text-4xl font-bold text-white"
            >
              Plan a Trip in{" "}
              <span className="gradient-text">3 Steps</span>
            </h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="flex flex-col items-center text-center"
              >
                {/* Step number */}
                <div className="mb-4 text-5xl font-bold text-white/4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {s.step}
                </div>
                {/* Icon circle */}
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ${s.ring} ${s.color}`}>
                  {s.icon}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">{s.title}</h3>
                <p className="leading-relaxed text-slate-400">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular destinations ─────────────────────────────────── */}
      <section className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              className="mb-3 text-4xl font-bold text-white"
            >
              Popular <span className="gradient-text">Destinations</span>
            </h2>
            <p className="text-slate-400">
              Get inspired by AI-crafted trips to the world&apos;s most loved places
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {DESTINATIONS.map((d, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                className="group relative h-56 cursor-pointer overflow-hidden rounded-2xl"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://source.unsplash.com/400x300/?${d.image}`}
                  alt={d.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-semibold text-white">{d.name}</p>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-slate-300">{d.days} days</span>
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Star className="h-3 w-3 fill-yellow-400" />
                      {d.rating}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl border border-white/10 p-12"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-2xl shadow-blue-500/25">
              <Compass className="h-8 w-8 text-white" />
            </div>
            <h2
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              className="mb-4 text-4xl font-bold text-white"
            >
              Ready to Plan Your{" "}
              <span className="gradient-text">Dream Trip?</span>
            </h2>
            <p className="mb-8 text-lg text-slate-400">
              Join travelers using AI to create unforgettable journeys. Free to
              start, no credit card required.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="px-10" icon={<ArrowRight className="h-5 w-5" />} iconPosition="right">
                  Start for Free
                </Button>
              </Link>
              <Link href="/explore">
                <Button size="lg" variant="ghost" className="px-10">
                  Browse Trips
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-blue-400" />
            <span className="font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Trip<span className="text-blue-400">Go</span>
            </span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
            <Link href="/trip/new" className="hover:text-white transition-colors">Plan Trip</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
          <p className="text-sm text-slate-600">
            Maps: OpenStreetMap · AI: Claude · © {new Date().getFullYear()} TripGo
          </p>
        </div>
      </footer>
    </div>
  );
}
