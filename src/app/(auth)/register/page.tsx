"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Compass, ArrowRight, User, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";

const PERKS = [
  "AI-generated personalized itineraries",
  "Interactive map with GPS directions",
  "Chat to customize your trip anytime",
  "Save & share trips with the community",
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }
      const result = await signIn("credentials", { email, password, redirect: false });
      setLoading(false);
      router.push(result?.error ? "/login" : "/trip/new");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute right-1/4 top-1/4 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-3xl gap-10 md:grid-cols-2 md:items-center">

        {/* ── Left: perks ── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden md:block"
        >
          <Link href="/" className="mb-8 flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/20">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-slate-900">
              Trip<span className="text-blue-600">Go</span>
            </span>
          </Link>

          <h2 className="font-display mb-3 text-4xl font-bold leading-tight text-slate-900">
            Your AI travel<br />
            <span className="gradient-text">companion awaits</span>
          </h2>
          <p className="mb-8 leading-relaxed text-slate-500">
            Join travelers using AI to create unforgettable trips.
            Free to start, no credit card needed.
          </p>

          <ul className="space-y-3.5">
            {PERKS.map((perk, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 text-sm text-slate-600"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-500" />
                {perk}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* ── Right: form ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          {/* Mobile logo */}
          <Link href="/" className="mb-7 flex items-center gap-2.5 md:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-md">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-slate-900">
              Trip<span className="text-blue-600">Go</span>
            </span>
          </Link>

          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-lg shadow-slate-200/80">
            <div className="mb-6">
              <h1 className="font-display mb-1.5 text-2xl font-bold text-slate-900">
                Create account
              </h1>
              <p className="text-sm text-slate-500">Start planning your perfect trip today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Full name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Your name" required autoComplete="name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none shadow-sm transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" required autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none shadow-sm transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPwd ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters" required minLength={6} autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 outline-none shadow-sm transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm text-red-600"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit" loading={loading} size="lg"
                className="mt-1 w-full shadow-lg shadow-blue-500/20"
                icon={<ArrowRight className="h-5 w-5" />} iconPosition="right"
              >
                Create Account
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
