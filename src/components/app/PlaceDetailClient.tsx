"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  Check,
  ExternalLink,
  MapPin,
  MessageSquarePlus,
  Plus,
  Share2,
  Star,
} from "lucide-react";
import { trackPlaceView } from "@/lib/client/analytics-tracker";
import { useMobileApp } from "./MobileAppContext";
import type { PlaceRatingsSummary } from "@/lib/queries/public-tourism";

interface PlaceActionPayload {
  id: string;
  name: string;
  slug: string;
  placeType: string;
  barangayName?: string | null;
  featuredImageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const TRAVELER_TYPES = ["Leisure", "Family", "Couple", "Barkada", "Solo"] as const;

function getOrCreateReviewerToken(): string {
  if (typeof window === "undefined") return "browser-guest";
  const key = "cedo_reviewer_token";
  let token = window.localStorage.getItem(key);
  if (!token) {
    token =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `rev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(key, token);
  }
  return token;
}

export function PlaceHeroOverlayControls({ place }: { place: PlaceActionPayload }) {
  const router = useRouter();
  const { savedPlaceIds, toggleBookmark, showToast } = useMobileApp();
  const saved = savedPlaceIds.includes(place.id);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/app/discover");
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${place.name} — Salcedo, Ilocos Sur`,
          text: `Explore ${place.name} on Project CEDO: Turi App`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Link copied", { tone: "info" });
    }
  };

  return (
    <div className="no-print absolute top-[max(12px,env(safe-area-inset-top))] left-3.5 right-3.5 z-20 flex items-center justify-between pointer-events-none">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        className="pointer-events-auto w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-white/60 shadow-sm flex items-center justify-center text-[#1A2421] active:scale-90 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="pointer-events-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => void handleShare()}
          aria-label="Share destination"
          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-white/60 shadow-sm flex items-center justify-center text-[#1A2421] active:scale-90 transition cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => void toggleBookmark(place.id, place.name)}
          aria-label={saved ? "Remove from saved" : "Save offline"}
          className={`w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-white/60 shadow-sm flex items-center justify-center active:scale-90 transition cursor-pointer ${
            saved ? "text-[#B88A44]" : "text-[#1A2421]"
          }`}
        >
          <Bookmark className="w-4 h-4" fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  );
}

export function PlaceRatingsSection({
  placeId,
  placeName,
  initialSummary,
}: {
  placeId: string;
  placeName: string;
  initialSummary: PlaceRatingsSummary;
}) {
  const { showToast } = useMobileApp();
  const [summary, setSummary] = useState<PlaceRatingsSummary>(initialSummary);
  const [formOpen, setFormOpen] = useState(false);
  const [stars, setStars] = useState<number>(5);
  const [travelerType, setTravelerType] =
    useState<(typeof TRAVELER_TYPES)[number]>("Leisure");
  const [reviewerName, setReviewerName] = useState("");
  const [originLabel, setOriginLabel] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedNotice, setSubmittedNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const reviewerToken = getOrCreateReviewerToken();
      const res = await fetch(`/api/places/${placeId}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: stars,
          reviewerName: reviewerName.trim() || null,
          originLabel: originLabel.trim() || null,
          travelerType,
          comment: comment.trim() || null,
          reviewerToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not submit your rating.");
        return;
      }
      setSummary(data.summary);
      setFormOpen(false);
      setSubmittedNotice(true);
      showToast(`Rated ${placeName} ${stars}★`, { tone: "success" });
    } catch {
      setError("Network error while saving rating.");
    } finally {
      setSubmitting(false);
    }
  };

  const total = summary.ratingCount;

  return (
    <section className="space-y-4 border-b border-[#EAE7E0] pb-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-bold text-[#1A2421]">
            Tourist Ratings &amp; Reviews
          </h2>
          <p className="text-[11px] text-[#616E69]">
            Account-free community ratings from visitors
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="no-print inline-flex items-center gap-1.5 rounded-full bg-[#164237] text-white px-3.5 py-1.5 text-xs font-semibold active:scale-95 transition cursor-pointer shrink-0"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          {submittedNotice ? "Update Rating" : "Rate Spot"}
        </button>
      </div>

      {/* Summary Card + 5-Bar Distribution */}
      <div className="bg-white rounded-2xl border border-[#EAE7E0] p-4 flex items-center gap-4">
        <div className="text-center shrink-0 pr-3 border-r border-[#EAE7E0] min-w-[82px]">
          <p className="font-display text-3xl font-bold text-[#1A2421] tabular-nums leading-none">
            {total > 0 ? summary.averageRating.toFixed(1) : "—"}
          </p>
          <div className="flex items-center justify-center gap-0.5 mt-1.5 text-[#B88A44]">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className="w-3 h-3"
                fill={
                  total > 0 && n <= Math.round(summary.averageRating)
                    ? "currentColor"
                    : "none"
                }
              />
            ))}
          </div>
          <p className="text-[10px] text-[#616E69] mt-1 tabular-nums">
            {total} {total === 1 ? "review" : "reviews"}
          </p>
        </div>

        <div className="flex-1 space-y-1">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const cnt = summary.distribution[star] ?? 0;
            const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-[10px]">
                <span className="w-4 text-[#616E69] font-semibold tabular-nums">
                  {star}★
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-[#F3F2EE] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#B88A44] transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-5 text-right text-[#616E69] tabular-nums">{cnt}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Account-Free Interactive Rating Form */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="no-print bg-white rounded-2xl border border-[#164237]/25 p-4 space-y-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="space-y-1">
            <p className="text-xs font-bold text-[#1A2421]">
              How was {placeName}?
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStars(n)}
                  aria-label={`Rate ${n} stars`}
                  className="p-1 active:scale-90 transition cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      n <= stars ? "text-[#B88A44]" : "text-[#D8D3C8]"
                    }`}
                    fill={n <= stars ? "currentColor" : "none"}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-semibold text-[#164237] tabular-nums">
                {stars}.0 / 5
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TRAVELER_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTravelerType(t)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold border cursor-pointer ${
                  travelerType === t
                    ? "bg-[#164237] text-white border-[#164237]"
                    : "bg-[#FAF9F6] text-[#1A2421] border-[#EAE7E0]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="Name (Optional)"
              maxLength={60}
              className="rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2 text-xs"
            />
            <input
              type="text"
              value={originLabel}
              onChange={(e) => setOriginLabel(e.target.value)}
              placeholder="From City (Optional)"
              maxLength={80}
              className="rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2 text-xs"
            />
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Share tips for other travelers (e.g., road access, best time, food)..."
            className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2 text-xs resize-none"
          />

          {error && (
            <p className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-800">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="flex-1 rounded-full border border-[#EAE7E0] py-2 text-xs font-semibold text-[#616E69] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] rounded-full bg-[#164237] text-white py-2 text-xs font-semibold disabled:opacity-50 active:scale-[0.98] transition cursor-pointer"
            >
              {submitting ? "Posting..." : "Post Rating"}
            </button>
          </div>
        </form>
      )}

      {/* Recent Reviews List */}
      {summary.reviews.length > 0 && (
        <div className="space-y-2.5">
          {summary.reviews.slice(0, 6).map((rev) => (
            <article
              key={rev.id}
              className="bg-white rounded-2xl border border-[#EAE7E0] p-3.5 space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display text-xs font-bold text-[#1A2421] truncate">
                    {rev.reviewerName}
                  </p>
                  <p className="text-[10px] text-[#616E69] truncate">
                    {rev.travelerType}
                    {rev.originLabel ? ` • ${rev.originLabel}` : ""}
                  </p>
                </div>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FAF9F6] border border-[#EAE7E0] px-2 py-0.5 text-[11px] font-bold text-[#1A2421] shrink-0 tabular-nums">
                  <Star className="w-3 h-3 text-[#B88A44]" fill="currentColor" />
                  {rev.rating}.0
                </span>
              </div>
              {rev.comment && (
                <p className="text-xs text-[#1A2421]/85 leading-relaxed">
                  {rev.comment}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function PlaceDetailActions({ place }: { place: PlaceActionPayload }) {
  const { draftStopIds, savedPlaceIds, addPlaceToActiveDraft, toggleBookmark } =
    useMobileApp();

  const saved = savedPlaceIds.includes(place.id);
  const inDraft = draftStopIds.includes(place.id);

  useEffect(() => {
    void trackPlaceView(place.id);
  }, [place.id]);

  const mapsUrl =
    place.latitude && place.longitude
      ? `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=16/${place.latitude}/${place.longitude}`
      : null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Link
          href="/app/map"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#164237]/10 px-3.5 py-1.5 text-xs font-semibold text-[#164237] active:scale-95 transition"
        >
          <MapPin className="w-3.5 h-3.5" />
          Salcedo Map
        </Link>
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#EAE7E0] bg-white px-3.5 py-1.5 text-xs font-medium text-[#1A2421] active:scale-95 transition"
          >
            Directions
            <ExternalLink className="w-3 h-3 text-[#616E69]" />
          </a>
        )}
      </div>

      {/* Native Sticky Action Dock at Bottom of Place Sheet */}
      <div className="no-print sticky bottom-0 left-0 right-0 z-30 -mx-4 px-4 py-3 mt-4 bg-white/95 backdrop-blur-md border-t border-[#EAE7E0] flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => void toggleBookmark(place.id, place.name)}
          aria-label={saved ? "Remove from saved" : "Save offline"}
          className={`w-11 h-11 rounded-full border flex items-center justify-center shrink-0 active:scale-90 transition cursor-pointer ${
            saved
              ? "bg-[#FAF9F6] border-[#B88A44] text-[#B88A44]"
              : "bg-white border-[#EAE7E0] text-[#1A2421]"
          }`}
        >
          <Bookmark className="w-4 h-4" fill={saved ? "currentColor" : "none"} />
        </button>

        {inDraft ? (
          <Link
            href="/app/trips"
            className="flex-1 h-11 rounded-full bg-[#F3F2EE] text-[#164237] font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
          >
            <Check className="w-4 h-4" />
            In My Trip • Open Planner
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => void addPlaceToActiveDraft(place)}
            className="flex-1 h-11 rounded-full bg-[#164237] text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-[#10322A] active:scale-[0.98] transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add to Itinerary
          </button>
        )}
      </div>
    </>
  );
}
