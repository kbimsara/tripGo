"use client";
import { Trip } from "@/types";
import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  Heart,
  Globe,
  Lock,
  Calendar,
  ArrowRight,
  Star,
} from "lucide-react";
import Link from "next/link";
import { formatDate, getImageUrl } from "@/lib/utils";
import { useState } from "react";

interface TripCardProps {
  trip: Trip;
  showOwner?: boolean;
  onSave?: (tripId: string) => void;
  isSaved?: boolean;
}

const BUDGET_BADGE: Record<string, { label: string; cls: string }> = {
  budget:   { label: "Budget",   cls: "text-emerald-400 bg-emerald-500/15 border-emerald-500/25" },
  moderate: { label: "Moderate", cls: "text-blue-400   bg-blue-500/15   border-blue-500/25" },
  luxury:   { label: "Luxury",   cls: "text-amber-400  bg-amber-500/15  border-amber-500/25" },
};

export default function TripCard({ trip, showOwner = false, onSave, isSaved = false }: TripCardProps) {
  const [saved, setSaved] = useState(isSaved);
  const [saving, setSaving] = useState(false);

  const imageUrl =
    trip.coverImage ||
    getImageUrl(trip.coverImageQuery || trip.destinations?.join(" ") || "travel", 600, 400);

  const budget = trip.budget ? BUDGET_BADGE[trip.budget] : null;

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (saving || !onSave) return;
    setSaving(true);
    setSaved(!saved);
    await onSave(trip._id);
    setSaving(false);
  };

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="group h-full"
    >
      <Link href={`/trip/${trip._id}`} className="block h-full">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-slate-800/60 transition-all duration-300 hover:border-white/20 hover:shadow-2xl hover:shadow-black/30">

          {/* ── Image ── */}
          <div className="relative h-44 flex-shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={trip.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://source.unsplash.com/600x400/?travel"; }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

            {/* Top-left badges */}
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium glass ${trip.isPublic ? "border-emerald-500/30 text-emerald-400" : "border-white/10 text-slate-400"}`}>
                {trip.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {trip.isPublic ? "Public" : "Private"}
              </span>
              {budget && (
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${budget.cls}`}>
                  {budget.label}
                </span>
              )}
            </div>

            {/* Save button */}
            {onSave && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full glass border border-white/10 transition-transform hover:scale-110 active:scale-95"
              >
                <Heart className={`h-4 w-4 transition-colors ${saved ? "fill-red-500 text-red-500" : "text-white"}`} />
              </button>
            )}

            {/* Saves count */}
            {trip.saves > 0 && (
              <div className="absolute bottom-2 right-3 flex items-center gap-1 rounded-full glass border border-white/10 px-2 py-0.5 text-xs text-slate-300">
                <Heart className="h-3 w-3 fill-red-400 text-red-400" />
                {trip.saves}
              </div>
            )}
          </div>

          {/* ── Body ── */}
          <div className="flex flex-1 flex-col p-4">
            {/* Title */}
            <h3 className="line-clamp-1 mb-1.5 font-semibold text-white transition-colors group-hover:text-blue-400">
              {trip.title}
            </h3>

            {/* Description */}
            <p className="line-clamp-2 mb-3 flex-1 text-sm leading-relaxed text-slate-400">
              {trip.description}
            </p>

            {/* Meta row */}
            <div className="mb-3 flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {trip.totalDays}d
              </span>
              {trip.destinations?.length > 0 && (
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{trip.destinations.slice(0, 2).join(", ")}</span>
                </span>
              )}
              <span className="ml-auto flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                {formatDate(trip.createdAt)}
              </span>
            </div>

            {/* Tags */}
            {trip.tags?.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {trip.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              {showOwner && trip.owner ? (
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold text-white">
                    {(trip.owner as { name: string }).name?.[0]?.toUpperCase()}
                  </div>
                  <span className="truncate text-xs text-slate-400">
                    {(trip.owner as { name: string }).name}
                  </span>
                </div>
              ) : (
                <span />
              )}
              <span className="flex shrink-0 items-center gap-1 text-xs text-blue-400 transition-all group-hover:gap-2">
                View trip <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
