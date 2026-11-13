"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, MapPin, Plus, Check } from "lucide-react";
import {
  listLocalDrafts,
  listSavedPlaceIds,
  saveLocalDraft,
  toggleSavedPlaceId,
} from "@/lib/client/indexeddb";

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
  restaurant: "Eatery & Dining",
  cafe: "Café",
  accommodation: "Stay",
  business: "Local Product",
  service: "Visitor Service",
};

export function PlaceCard({
  place,
  compact = false,
}: {
  place: PlaceCardData;
  compact?: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const [addedToTrip, setAddedToTrip] = useState(false);

  useEffect(() => {
    let active = true;
    listSavedPlaceIds().then((ids) => {
      if (active) setSaved(ids.includes(place.id));
    });
    return () => {
      active = false;
    };
  }, [place.id]);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = await toggleSavedPlaceId(place.id);
    setSaved(next);
  };

  const handleQuickAddToTrip = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const drafts = await listLocalDrafts();
    const activeDraft = drafts[0] ?? {
      id: `draft-${Date.now()}`,
      title: "My Salcedo Day Trip",
      plannedVisitDate: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
      description: "Planned using Project CEDO: Turi App",
      stops: [],
      updatedAt: new Date().toISOString(),
    };

    if (!activeDraft.stops.some((s) => s.placeId === place.id)) {
      activeDraft.stops.push({
        placeId: place.id,
        placeName: place.name,
        placeSlug: place.slug,
        placeType: place.placeType,
        barangayName: place.barangay?.name ?? null,
        featuredImageUrl: place.featuredImageUrl ?? null,
        latitude: place.latitude ?? null,
        longitude: place.longitude ?? null,
        visitTime: activeDraft.stops.length === 0 ? "09:00" : "",
        durationMinutes: 90,
        personalNotes: "",
      });
      activeDraft.updatedAt = new Date().toISOString();
      await saveLocalDraft(activeDraft);
    }
    setAddedToTrip(true);
    setTimeout(() => setAddedToTrip(false), 2000);
  };

  const imageSrc = place.featuredImageUrl || "/images/salcedo/hero-salcedo-valley.png";

  return (
    <article className="group bg-white rounded-2xl border border-[#E5E0D5] overflow-hidden shadow-xs hover:shadow-md hover:border-[#168A8A]/40 transition flex flex-col">
      <Link href={`/app/places/${place.slug}`} className="block relative overflow-hidden">
        <div className={compact ? "aspect-[16/10]" : "aspect-[16/11]"}>
          <img
            src={imageSrc}
            alt={place.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-x-0 top-0 p-3 flex items-start justify-between gap-2 bg-gradient-to-b from-black/45 via-black/15 to-transparent">
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded-full bg-[#123F35]/90 backdrop-blur-xs text-white px-2.5 py-0.5 text-[11px] font-semibold">
              {TYPE_LABELS[place.placeType] || place.primaryCategory?.name || "Salcedo"}
            </span>
            {place.isHiddenGem && (
              <span className="inline-flex items-center rounded-full bg-[#D6A85B] text-[#0D3029] px-2.5 py-0.5 text-[11px] font-bold">
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
                : "bg-black/35 text-white hover:bg-black/55"
            }`}
          >
            <Bookmark className="w-4 h-4" fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
      </Link>

      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1.5">
          <Link href={`/app/places/${place.slug}`}>
            <h3 className="font-display font-bold text-base sm:text-lg text-[#202B28] group-hover:text-[#123F35] transition line-clamp-1">
              {place.name}
            </h3>
          </Link>
          <p className="inline-flex items-center gap-1 text-xs font-medium text-[#168A8A]">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {place.barangay ? `Brgy. ${place.barangay.name}` : place.address}
            </span>
          </p>
          <p className="text-xs sm:text-sm text-[#5A6B66] line-clamp-2 leading-relaxed">
            {place.shortDescription}
          </p>
        </div>

        <div className="pt-2 border-t border-[#E5E0D5]/70 flex items-center justify-between gap-2">
          <Link
            href={`/app/places/${place.slug}`}
            className="text-xs font-bold text-[#123F35] hover:text-[#168A8A] transition"
          >
            View Details →
          </Link>
          <button
            type="button"
            onClick={handleQuickAddToTrip}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
              addedToTrip
                ? "bg-emerald-100 text-emerald-900"
                : "bg-[#F8F7F2] text-[#123F35] hover:bg-[#123F35] hover:text-white border border-[#E5E0D5]"
            }`}
          >
            {addedToTrip ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Added
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Add to Trip
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
