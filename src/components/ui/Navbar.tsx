"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Compass, User, LogOut, Plus, Menu, X, Globe, ChevronDown, Map } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./Button";

const NAV_LINKS = [
  { href: "/explore",  label: "Explore",   icon: Globe },
  { href: "/trip/new", label: "Plan Trip",  icon: Map   },
];

export default function Navbar() {
  const { data: session }   = useSession();
  const pathname            = usePathname();
  const [menuOpen, setMenuOpen]       = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  /* Scroll detection */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close user menu on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Close mobile menu on route change */
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white shadow-md shadow-black/5 border-b border-slate-200"
          : "bg-white/80 backdrop-blur-lg border-b border-slate-100"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* ── Logo ── */}
        <Link href="/" className="group flex items-center gap-2.5 shrink-0">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-md shadow-blue-500/20 transition-shadow group-hover:shadow-blue-500/35">
            <Compass className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-[17px] font-bold text-slate-900 tracking-tight">
            Trip<span className="text-blue-600">Go</span>
          </span>
        </Link>

        {/* ── Desktop nav links ── */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(href)
                  ? "text-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {/* Background span must come FIRST so text renders on top */}
              {isActive(href) && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg bg-blue-50"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon className="relative h-3.5 w-3.5 z-10" />
              <span className="relative z-10">{label}</span>
            </Link>
          ))}
        </div>

        {/* ── Desktop auth ── */}
        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              <Link href="/trip/new">
                <Button
                  size="sm"
                  icon={<Plus className="h-3.5 w-3.5" />}
                  className="shadow-md shadow-blue-500/15"
                >
                  New Trip
                </Button>
              </Link>

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="max-w-[90px] truncate text-xs font-medium">
                    {session.user?.name}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-black/10"
                    >
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-900 truncate">{session.user?.name}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{session.user?.email}</p>
                      </div>

                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4 text-slate-400" />
                        Dashboard
                      </Link>

                      <div className="mx-3 border-t border-slate-100" />

                      <button
                        onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: window.location.origin }); }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50"
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
                <Button size="sm" className="shadow-md shadow-blue-500/15">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 md:hidden"
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={menuOpen ? "close" : "open"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.div>
          </AnimatePresence>
        </button>
      </div>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden border-t border-slate-100 bg-white md:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(href)
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}

              <div className="pt-2 border-t border-slate-100 mt-1">
                {session ? (
                  <>
                    {/* User info */}
                    <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                        {session.user?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{session.user?.name}</p>
                        <p className="text-xs text-slate-500">{session.user?.email}</p>
                      </div>
                    </div>

                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <User className="h-4 w-4 text-slate-400" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: window.location.origin })}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <Link href="/login" className="flex-1">
                      <Button variant="ghost" className="w-full" size="sm">Sign In</Button>
                    </Link>
                    <Link href="/register" className="flex-1">
                      <Button className="w-full" size="sm">Get Started</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
