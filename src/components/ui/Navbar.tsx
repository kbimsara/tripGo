"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Map, Compass, User, LogOut, Plus, Menu, X, Globe, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./Button";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/8">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-105">
            <Compass className="h-4 w-4 text-white" />
          </div>
          <span
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            className="text-lg font-bold text-white"
          >
            Trip<span className="text-blue-400">Go</span>
          </span>
        </Link>

        {/* Desktop centre nav */}
        <div className="hidden items-center gap-1 md:flex">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Globe className="h-4 w-4" />
            Explore
          </Link>
          <Link
            href="/trip/new"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Map className="h-4 w-4" />
            Plan Trip
          </Link>
        </div>

        {/* Desktop auth */}
        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              <Link href="/trip/new">
                <Button size="sm" icon={<Plus className="h-4 w-4" />}>New Trip</Button>
              </Link>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/5"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold text-white shadow">
                    {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="max-w-[100px] truncate">{session.user?.name}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-slate-800 shadow-2xl"
                      onMouseLeave={() => setUserMenuOpen(false)}
                    >
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <div className="mx-3 border-t border-white/5" />
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/5 hover:text-white md:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/5 glass-dark md:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              <Link
                href="/explore"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                <Globe className="h-4 w-4" />
                Explore
              </Link>
              <Link
                href="/trip/new"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                <Map className="h-4 w-4" />
                Plan Trip
              </Link>

              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link href="/login" className="flex-1" onClick={() => setMenuOpen(false)}>
                    <Button variant="ghost" className="w-full">Sign In</Button>
                  </Link>
                  <Link href="/register" className="flex-1" onClick={() => setMenuOpen(false)}>
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
