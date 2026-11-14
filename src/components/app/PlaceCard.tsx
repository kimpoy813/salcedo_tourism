"use client";

import React from "react";
import Link from "next/link";
import { Bookmark, Check, Eye, MapPin, Plus, Star } from "lucide-react";
import { useMobileApp } from "./MobileAppContext";

export interface PlaceCardData {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  placeType: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  featuredImageUrl?: string | null;
  isFeatured?: boolean;
  isHiddenGem?: boolean;
  averageRating?: number;
  ratingCount?: number;
  viewCount?: number;
  arrivalsCount?: number;
  itineraryCount?: number;
  visitCount?: number;
  mostVisitedRank?: number;
  topRatedRank?: number;
  categoryRank?: number;
  barangay?: { name: string; slug: string } | null;
  primaryCategory?: { id?: string; name: string; slug: string } | null;
}

const TYPE_LABELS: Record<string, string> = {
  attraction: "Attraction",
  nature: "Nature",
  heritage: "Heritage",
  resort: "Resort",
  restaurant: "Dining",
  cafe: "Café",
  accommodation: "Stay",
  business: "Craft",
  service: "Service",
};

function getRankStyle(rank: number) {
  if (rank === 1) return "bg-[#B88A44] text-white border-[#B88A44]";
  if (rank === 2) return "bg-[#164237] text-white border-[#164237]";
  if (rank === 3) return "bg-[#1D7874] text-white border-[#1D7874]";
  return "bg-white/95 text-[#1A2421] border-[#EAE7E0]";
}

export function PlaceCard({
  place,
  variant = "card",
  rankBadge,
}: {
  place: PlaceCardData;
  variant?: "card" | "rail" | "row" | "spotlight";
  rankBadge?: { rank: number; label?: string } | null;
}) {
  const { draftStopIds, savedPlaceIds, addPlaceToActiveDraft, toggleBookmark } =
    useMobileApp();

  const saved = savedPlaceIds.includes(place.id);
  const inDraft = draftStopIds.includes(place.id);
  const imageSrc = place.featuredImageUrl || "/images/salcedo/hero-salcedo-valley.png";

  const hasRating = (place.ratingCount ?? 0) > 0 && (place.averageRating ?? 0) > 0;
  const visitCount = place.visitCount ?? 0;

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleBookmark(place.id, place.name);
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addPlaceToActiveDraft({
      id: place.id,
      name: place.name,
      slug: place.slug,
      placeType: place.placeType,
      barangayName: place.barangay?.name ?? null,
      featuredImageUrl: place.featuredImageUrl ?? null,
      latitude: place.latitude ?? null,
      longitude: place.longitude ?? null,
    });
  };

  // Spotlight Native Carousel Card
  if (variant === "spotlight") {
    return (
      <article className="relative w-[84%] max-w-[330px] shrink-0 snap-start rounded-[24px] overflow-hidden border border-[#EAE7E0] bg-[#164237] shadow-xs active:scale-[0.985] transition-transform">
        <Link href={`/app/places/${place.slug}`} className="block relative aspect-[16/10]">
          <img
            src={imageSrc}
            alt={place.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/25 to-transparent" />

          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            {rankBadge && (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold shadow-xs tabular-nums ${getRankStyle(
                  rankBadge.rank
                )}`}
              >
                #{rankBadge.rank}
                {rankBadge.label ? ` ${rankBadge.label}` : ""}
              </span>
            )}
            {hasRating && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur-md text-white px-2.5 py-0.5 text-[11px] font-semibold tabular-nums">
                <Star className="w-3 h-3 text-[#F5C451]" fill="currentColor" />
                {place.averageRating?.toFixed(1)}
                <span className="text-white/75 font-normal">({place.ratingCount})</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleToggleSave}
            aria-label={saved ? "Remove from saved" : "Save place"}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition active:scale-90 cursor-pointer ${
              saved ? "bg-white text-[#B88A44]" : "bg-black/35 text-white hover:bg-black/50"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" fill={saved ? "currentColor" : "none"} />
          </button>

          <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between gap-2 text-white">
            <div className="min-w-0 space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                <span>{TYPE_LABELS[place.placeType] || "Salcedo"}</span>
                {place.barangay && <span>• Brgy. {place.barangay.name}</span>}
                {visitCount > 0 && (
                  <span className="tabular-nums">• {visitCount} visits</span>
                )}
              </p>
              <h3 className="font-display text-base font-bold leading-snug line-clamp-1">
                {place.name}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleQuickAdd}
              className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition active:scale-95 cursor-pointer ${
                inDraft
                  ? "bg-white text-[#164237]"
                  : "bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-[#164237]"
              }`}
            >
              {inDraft ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {inDraft ? "Added ✓" : "＋ Add"}
            </button>
          </div>
        </Link>
      </article>
    );
  }

  // Native Horizontal List Cell
  if (variant === "row") {
    return (
      <article className="bg-white rounded-2xl border border-[#EAE7E0] overflow-hidden flex items-stretch transition active:scale-[0.99]">
        <Link
          href={`/app/places/${place.slug}`}
          className="relative w-26 shrink-0 overflow-hidden bg-[#F3F2EE]"
        >
          <img
            src={imageSrc}
            alt={place.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {rankBadge && (
            <span
              className={`absolute top-2 left-2 inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-bold shadow-xs tabular-nums ${getRankStyle(
                rankBadge.rank
              )}`}
            >
              #{rankBadge.rank}
            </span>
          )}
        </Link>

        <div className="flex-1 min-w-0 p-3 flex flex-col justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-start justify-between gap-1.5">
              <Link href={`/app/places/${place.slug}`} className="min-w-0 flex-1">
                <h3 className="font-display font-bold text-sm text-[#1A2421] leading-snug line-clamp-1">
                  {place.name}
                </h3>
              </Link>
              <button
                type="button"
                onClick={handleToggleSave}
                aria-label={saved ? "Remove from saved" : "Save place"}
                className={`p-0.5 shrink-0 active:scale-90 transition cursor-pointer ${
                  saved ? "text-[#B88A44]" : "text-[#616E69]/70 hover:text-[#1A2421]"
                }`}
              >
                <Bookmark className="w-4 h-4" fill={saved ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#616E69]">
              <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
                <MapPin className="w-3 h-3 text-[#1D7874] shrink-0" />
                <span className="truncate">
                  {place.barangay ? `Brgy. ${place.barangay.name}` : place.address}
                </span>
              </span>
              {hasRating && (
                <span className="inline-flex items-center gap-0.5 font-semibold text-[#1A2421] tabular-nums">
                  <Star className="w-3 h-3 text-[#B88A44]" fill="currentColor" />
                  {place.averageRating?.toFixed(1)}
                  <span className="font-normal text-[#616E69]">({place.ratingCount})</span>
                </span>
              )}
              {visitCount > 0 && (
                <span className="inline-flex items-center gap-0.5 tabular-nums">
                  <Eye className="w-3 h-3 text-[#616E69]" />
                  {visitCount}
                </span>
              )}
            </div>

            <p className="text-xs text-[#616E69] line-clamp-2 leading-snug">
              {place.shortDescription}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#616E69]">
              {TYPE_LABELS[place.placeType] || "Salcedo"}
            </span>
            <button
              type="button"
              onClick={handleQuickAdd}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition active:scale-95 cursor-pointer ${
                inDraft
                  ? "bg-[#164237]/10 text-[#164237]"
                  : "bg-[#F3F2EE] text-[#1A2421] hover:bg-[#164237] hover:text-white"
              }`}
            >
              {inDraft ? (
                <>
                  <Check className="w-3 h-3" />
                  Added ✓
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  Add to Trip
                </>
              )}
            </button>
          </div>
        </div>
      </article>
    );
  }

  // Native Vertical / Snap-Scroll Rail Card
  return (
    <article
      className={`group bg-white rounded-2xl border border-[#EAE7E0] overflow-hidden flex flex-col transition active:scale-[0.985] ${
        variant === "rail" ? "w-[236px] shrink-0 snap-start" : "w-full"
      }`}
    >
      <Link href={`/app/places/${place.slug}`} className="block relative overflow-hidden">
        <div className="aspect-[16/10] bg-[#F3F2EE]">
          <img
            src={imageSrc}
            alt={place.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {rankBadge ? (
          <span
            className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold shadow-xs tabular-nums ${getRankStyle(
              rankBadge.rank
            )}`}
          >
            #{rankBadge.rank}
            {rankBadge.label ? ` ${rankBadge.label}` : ""}
          </span>
        ) : hasRating ? (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/92 backdrop-blur-sm text-[#1A2421] px-2 py-0.5 text-[10px] font-bold shadow-2xs tabular-nums">
            <Star className="w-3 h-3 text-[#B88A44]" fill="currentColor" />
            {place.averageRating?.toFixed(1)}
          </span>
        ) : null}

        <button
          type="button"
          onClick={handleToggleSave}
          aria-label={saved ? "Remove from saved" : "Save place"}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition active:scale-90 cursor-pointer ${
            saved
              ? "bg-white text-[#B88A44] shadow-xs"
              : "bg-white/85 text-[#1A2421] hover:bg-white"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" fill={saved ? "currentColor" : "none"} />
        </button>
      </Link>

      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#616E69]">
            <span className="truncate">
              {TYPE_LABELS[place.placeType] || "Salcedo"}
              {place.barangay ? ` • Brgy. ${place.barangay.name}` : ""}
            </span>
            {visitCount > 0 && (
              <span className="tabular-nums shrink-0">{visitCount} visits</span>
            )}
          </div>
          <Link href={`/app/places/${place.slug}`}>
            <h3 className="font-display font-bold text-[15px] text-[#1A2421] line-clamp-1">
              {place.name}
            </h3>
          </Link>
          <p className="text-xs text-[#616E69] line-clamp-2 leading-relaxed">
            {place.shortDescription}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#EAE7E0]">
          <Link
            href={`/app/places/${place.slug}`}
            className="text-xs font-semibold text-[#164237] hover:underline"
          >
            Explore →
          </Link>
          <button
            type="button"
            onClick={handleQuickAdd}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition active:scale-95 cursor-pointer ${
              inDraft
                ? "bg-[#164237]/10 text-[#164237]"
                : "bg-[#F3F2EE] text-[#1A2421] hover:bg-[#164237] hover:text-white"
            }`}
          >
            {inDraft ? (
              <>
                <Check className="w-3 h-3" />
                Added ✓
              </>
            ) : (
              <>
                <Plus className="w-3 h-3" />
                Add to Trip
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
