"use client";

import React from "react";
import Link from "next/link";
import { Bookmark, Check, MapPin, Plus } from "lucide-react";
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
  nature: "Nature",
  heritage: "Heritage",
  resort: "Resort",
  restaurant: "Dining",
  cafe: "Café",
  accommodation: "Stay",
  business: "Craft",
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

  // Minimalist Horizontal Row Card
  if (variant === "row") {
    return (
      <article className="bg-white rounded-2xl border border-[#EAE7E0] overflow-hidden flex items-stretch transition hover:border-[#D4CFC3]">
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
                className={`p-0.5 shrink-0 cursor-pointer ${
                  saved ? "text-[#B88A44]" : "text-[#616E69]/70 hover:text-[#1A2421]"
                }`}
              >
                <Bookmark className="w-4 h-4" fill={saved ? "currentColor" : "none"} />
              </button>
            </div>
            <p className="inline-flex items-center gap-1 text-[11px] text-[#616E69]">
              <MapPin className="w-3 h-3 text-[#1D7874] shrink-0" />
              <span className="truncate">
                {place.barangay ? `Brgy. ${place.barangay.name}` : place.address}
              </span>
              <span className="opacity-40">•</span>
              <span className="shrink-0">
                {TYPE_LABELS[place.placeType] || "Salcedo"}
              </span>
            </p>
            <p className="text-xs text-[#616E69] line-clamp-2 leading-snug">
              {place.shortDescription}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <Link
              href={`/app/places/${place.slug}`}
              className="text-[11px] font-semibold text-[#164237] hover:underline"
            >
              Details
            </Link>
            <button
              type="button"
              onClick={handleQuickAdd}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                inDraft
                  ? "bg-[#164237]/10 text-[#164237]"
                  : "bg-[#F3F2EE] text-[#1A2421] hover:bg-[#164237] hover:text-white"
              }`}
            >
              {inDraft ? (
                <>
                  <Check className="w-3 h-3" />
                  Added
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  Trip
                </>
              )}
            </button>
          </div>
        </div>
      </article>
    );
  }

  // Minimalist Vertical / Rail Card (clean photography, no heavy badge overlays)
  return (
    <article
      className={`group bg-white rounded-2xl border border-[#EAE7E0] overflow-hidden flex flex-col transition hover:border-[#D4CFC3] ${
        variant === "rail" ? "w-[252px] shrink-0 snap-start" : "w-full"
      }`}
    >
      <Link href={`/app/places/${place.slug}`} className="block relative overflow-hidden">
        <div className="aspect-[16/10] bg-[#F3F2EE]">
          <img
            src={imageSrc}
            alt={place.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500"
            loading="lazy"
          />
        </div>
        <button
          type="button"
          onClick={handleToggleSave}
          aria-label={saved ? "Remove from saved" : "Save place"}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition cursor-pointer ${
            saved
              ? "bg-white text-[#B88A44] shadow-xs"
              : "bg-white/80 text-[#1A2421] hover:bg-white"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" fill={saved ? "currentColor" : "none"} />
        </button>
      </Link>

      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#616E69]">
            {TYPE_LABELS[place.placeType] || "Salcedo"}
            {place.barangay ? ` • Brgy. ${place.barangay.name}` : ""}
          </p>
          <Link href={`/app/places/${place.slug}`}>
            <h3 className="font-display font-bold text-[15px] text-[#1A2421] group-hover:text-[#164237] transition line-clamp-1">
              {place.name}
            </h3>
          </Link>
          <p className="text-xs text-[#616E69] line-clamp-2 leading-relaxed">
            {place.shortDescription}
          </p>
        </div>

        <div className="pt-2 border-t border-[#EAE7E0] flex items-center justify-between gap-2">
          <Link
            href={`/app/places/${place.slug}`}
            className="text-xs font-semibold text-[#164237] hover:underline"
          >
            Read guide →
          </Link>
          <button
            type="button"
            onClick={handleQuickAdd}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition cursor-pointer ${
              inDraft
                ? "bg-[#164237]/10 text-[#164237]"
                : "bg-[#F3F2EE] text-[#1A2421] hover:bg-[#164237] hover:text-white"
            }`}
          >
            {inDraft ? (
              <>
                <Check className="w-3 h-3" />
                Added
              </>
            ) : (
              <>
                <Plus className="w-3 h-3" />
                Trip
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
