"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Compass, ArrowRight, Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) setError("Invalid email or password");
    else router.push("/dashboard");
  };

  return (
    <div className="animated-gradient flex min-h-screen items-center justify-center px-4">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-80 w-80 rounded-full bg-blue-600/12 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-violet-600/12 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg transition-transform group-hover:scale-105">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <span
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-xl font-bold text-white"
          >
            Trip<span className="text-blue-400">Go</span>
          </span>
        </Link>

        {/* Card */}
        <div className="glass rounded-3xl border border-white/10 p-8 shadow-2xl shadow-black/30">
          <div className="mb-7 text-center">
            <h1
              style={{ fontFamily: "'Playfair Display', serif" }}
              className="mb-1.5 text-2xl font-bold text-white"
            >
              Welcome back
            </h1>
            <p className="text-sm text-slate-400">Sign in to continue planning your trips</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-center text-sm text-red-400"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              loading={loading}
              size="lg"
              className="mt-1 w-full"
              icon={<ArrowRight className="h-5 w-5" />}
              iconPosition="right"
            >
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            No account?{" "}
            <Link href="/register" className="font-medium text-blue-400 hover:text-blue-300">
              Create one free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
