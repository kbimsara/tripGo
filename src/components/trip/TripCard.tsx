"use client";
import { Trip } from "@/types";
import { motion } from "framer-motion";
import { MapPin, Clock, Heart, Globe, Lock, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { formatDate, getImageUrl } from "@/lib/utils";
import { useState, useEffect } from "react";

interface TripCardProps {
  trip: Trip;
  showOwner?: boolean;
  onSave?: (tripId: string) => void;
  isSaved?: boolean;
}

const BUDGET_COLORS: Record<string, string> = {
  budget:   "text-emerald-600",
  moderate: "text-blue-600",
  luxury:   "text-amber-600",
};

const BUDGET_BG: Record<string, string> = {
  budget:   "bg-emerald-50 border-emerald-100",
  moderate: "bg-blue-50 border-blue-100",
  luxury:   "bg-amber-50 border-amber-100",
};

const BUDGET_DOT: Record<string, string> = {
  budget:   "bg-emerald-500",
  moderate: "bg-blue-500",
  luxury:   "bg-amber-500",
};

export default function TripCard({ trip, showOwner = false, onSave, isSaved = false }: TripCardProps) {
  const [saved, setSaved] = useState(isSaved);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setSaved(isSaved); }, [isSaved]);

  const imageUrl =
    trip.coverImage ||
    getImageUrl(trip.coverImageQuery || trip.destinations?.join(" ") || "travel", 600, 400);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (saving || !onSave) return;
    setSaving(true);
    setSaved(!saved);
    await onSave(trip._id);
    setSaving(false);
  };

  const placeCount = trip.days?.reduce((s, d) => s + (d.places?.length || 0), 0) || 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="group h-full"
    >
      <Link href={`/trip/${trip._id}`} className="block h-full">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/8">

          {/* ── Image ── */}
          <div className="relative h-48 flex-shrink-0 overflow-hidden bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={trip.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  `https://picsum.photos/seed/${encodeURIComponent(trip.title)}/600/400`;
              }}
            />
            {/* Subtle gradient at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

            {/* Duration badge — top left */}
            <div className="absolute left-3 top-3">
              <span className="inline-flex items-center gap-1 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
                <Clock className="h-3 w-3" />
                {trip.totalDays} {trip.totalDays === 1 ? "day" : "days"}
              </span>
            </div>

            {/* Save button — top right */}
            {onSave && (
              <button
                onClick={handleSave}
                disabled={saving}
                title={saved ? "Unsave" : "Save trip"}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-white/80 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white active:scale-95 shadow-sm"
              >
                <Heart
                  className={`h-3.5 w-3.5 transition-colors ${
                    saved ? "fill-red-500 text-red-500" : "text-slate-500"
                  }`}
                />
              </button>
            )}

            {/* Visibility badge — bottom left */}
            <div className="absolute bottom-3 left-3">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur-sm ${
                  trip.isPublic
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                    : "bg-black/30 text-slate-300 border border-white/15"
                }`}
              >
                {trip.isPublic ? <Globe className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                {trip.isPublic ? "Public" : "Private"}
              </span>
            </div>

            {/* Saves count — bottom right */}
            {trip.saves > 0 && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                <Heart className="h-2.5 w-2.5 fill-red-400 text-red-400" />
                {trip.saves}
              </div>
            )}
          </div>

          {/* ── Body ── */}
          <div className="flex flex-1 flex-col p-4">

            {/* Title */}
            <h3 className="mb-1.5 font-semibold text-slate-900 leading-snug line-clamp-1 transition-colors group-hover:text-blue-600">
              {trip.title}
            </h3>

            {/* Description */}
            <p className="mb-3 flex-1 text-sm leading-relaxed text-slate-500 line-clamp-2">
              {trip.description}
            </p>

            {/* Tags */}
            {trip.tags?.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {trip.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Meta pills */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {placeCount > 0 && (
                <span className="flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200 px-2 py-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" />
                  {placeCount} stops
                </span>
              )}

              {trip.budget && (
                <span className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${BUDGET_BG[trip.budget] || "bg-slate-50 border-slate-200"} ${BUDGET_COLORS[trip.budget] || "text-slate-500"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${BUDGET_DOT[trip.budget] || "bg-slate-400"}`} />
                  {trip.budget.charAt(0).toUpperCase() + trip.budget.slice(1)}
                </span>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              {showOwner && trip.owner ? (
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)" }}
                  >
                    {(trip.owner as { name: string }).name?.[0]?.toUpperCase()}
                  </div>
                  <span className="truncate text-xs text-slate-500">
                    {(trip.owner as { name: string }).name}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">{formatDate(trip.createdAt)}</span>
              )}

              <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-slate-400 group-hover:text-blue-600 transition-colors">
                View Details
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
