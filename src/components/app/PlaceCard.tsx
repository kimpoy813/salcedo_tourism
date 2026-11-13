"use client";

import React from "react";
import Link from "next/link";
import { Bookmark, Check, ChevronRight, MapPin, Plus } from "lucide-react";
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
  barangay?: { name: string; slug: string } | null;
  primaryCategory?: { name: string; slug: string } | null;
}

const TYPE_LABELS: Record<string, string> = {
  attraction: "Attraction",
  nature: "Nature & Falls",
  heritage: "Heritage",
  resort: "Resort",
  restaurant: "Eatery",
  cafe: "Café",
  accommodation: "Stay",
  business: "Local Product",
  service: "Service",
};

export function PlaceCard({
  place,
  variant = "card",
}: {
  place: PlaceCardData;
  variant?: "card" | "rail" | "row";
}) {
  const { draftStopIds, savedPlaceIds, addPlaceToActiveDraft, toggleBookmark } =
    useMobileApp();

  const saved = savedPlaceIds.includes(place.id);
  const inDraft = draftStopIds.includes(place.id);
  const imageSrc = place.featuredImageUrl || "/images/salcedo/hero-salcedo-valley.png";

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

  // Compact Horizontal Row Variant (Mobile Directory List)
  if (variant === "row") {
    return (
      <article className="bg-white rounded-2xl border border-[#E5E0D5] overflow-hidden shadow-2xs active:scale-[0.99] transition flex items-stretch">
        <Link
          href={`/app/places/${place.slug}`}
          className="relative w-28 shrink-0 overflow-hidden bg-[#E5E0D5]/40"
        >
          <img
            src={imageSrc}
            alt={place.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {place.isHiddenGem && (
            <span className="absolute top-1.5 left-1.5 rounded-full bg-[#D6A85B] text-[#0D3029] px-1.5 py-0.5 text-[9px] font-extrabold">
              Gem
            </span>
          )}
        </Link>

        <div className="flex-1 min-w-0 p-3 flex flex-col justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-start justify-between gap-1.5">
              <Link href={`/app/places/${place.slug}`} className="min-w-0 flex-1">
                <h3 className="font-display font-bold text-sm text-[#202B28] leading-snug line-clamp-1">
                  {place.name}
                </h3>
              </Link>
              <button
                type="button"
                onClick={handleToggleSave}
                aria-label={saved ? "Remove from saved places" : "Save place"}
                className={`p-1 rounded-full shrink-0 cursor-pointer ${
                  saved ? "text-[#D6A85B]" : "text-[#5A6B66]"
                }`}
              >
                <Bookmark className="w-4 h-4" fill={saved ? "currentColor" : "none"} />
              </button>
            </div>
            <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#168A8A]">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {place.barangay ? `Brgy. ${place.barangay.name}` : place.address}
              </span>
              <span className="text-[#5A6B66]/60">•</span>
              <span className="text-[#5A6B66] shrink-0">
                {TYPE_LABELS[place.placeType] || "Salcedo"}
              </span>
            </p>
            <p className="text-xs text-[#5A6B66] line-clamp-2 leading-snug">
              {place.shortDescription}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <Link
              href={`/app/places/${place.slug}`}
              className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#123F35]"
            >
              Details <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={handleQuickAdd}
              className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                inDraft
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                  : "bg-[#123F35] text-white hover:bg-[#0D3029]"
              }`}
            >
              {inDraft ? (
                <>
                  <Check className="w-3 h-3" />
                  In Trip
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  Add Trip
                </>
              )}
            </button>
          </div>
        </div>
      </article>
    );
  }

  // Mobile Card / Carousel Rail Card
  return (
    <article
      className={`group bg-white rounded-2xl border border-[#E5E0D5] overflow-hidden shadow-xs transition flex flex-col ${
        variant === "rail" ? "w-[272px] shrink-0 snap-start" : "w-full"
      }`}
    >
      <Link href={`/app/places/${place.slug}`} className="block relative overflow-hidden">
        <div className="aspect-[16/10]">
          <img
            src={imageSrc}
            alt={place.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-x-0 top-0 p-2.5 flex items-start justify-between gap-2 bg-gradient-to-b from-black/50 via-black/15 to-transparent">
          <div className="flex flex-wrap gap-1">
            <span className="inline-flex items-center rounded-full bg-[#123F35]/90 backdrop-blur-xs text-white px-2 py-0.5 text-[10px] font-semibold">
              {TYPE_LABELS[place.placeType] || place.primaryCategory?.name || "Salcedo"}
            </span>
            {place.isHiddenGem && (
              <span className="inline-flex items-center rounded-full bg-[#D6A85B] text-[#0D3029] px-2 py-0.5 text-[10px] font-bold">
                Hidden Gem
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleToggleSave}
            aria-label={saved ? "Remove from saved places" : "Save place"}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xs transition cursor-pointer ${
              saved
                ? "bg-[#D6A85B] text-[#0D3029]"
                : "bg-black/40 text-white hover:bg-black/60"
            }`}
          >
            <Bookmark className="w-4 h-4" fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
      </Link>

      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5">
        <div className="space-y-1">
          <Link href={`/app/places/${place.slug}`}>
            <h3 className="font-display font-bold text-[15px] text-[#202B28] group-hover:text-[#123F35] transition line-clamp-1">
              {place.name}
            </h3>
          </Link>
          <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#168A8A]">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {place.barangay ? `Brgy. ${place.barangay.name}` : place.address}
            </span>
          </p>
          <p className="text-xs text-[#5A6B66] line-clamp-2 leading-relaxed">
            {place.shortDescription}
          </p>
        </div>

        <div className="pt-2 border-t border-[#E5E0D5]/70 flex items-center justify-between gap-2">
          <Link
            href={`/app/places/${place.slug}`}
            className="text-xs font-bold text-[#123F35] hover:text-[#168A8A] transition py-1"
          >
            View Guide →
          </Link>
          <button
            type="button"
            onClick={handleQuickAdd}
            className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              inDraft
                ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                : "bg-[#F8F7F2] text-[#123F35] hover:bg-[#123F35] hover:text-white border border-[#E5E0D5]"
            }`}
          >
            {inDraft ? (
              <>
                <Check className="w-3.5 h-3.5" />
                In Trip
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Add Trip
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
