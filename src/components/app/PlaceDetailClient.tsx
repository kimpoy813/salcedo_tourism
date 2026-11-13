"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Bookmark, Check, ExternalLink, MapPin, Plus, Share2 } from "lucide-react";
import { trackPlaceView } from "@/lib/client/analytics-tracker";
import { useMobileApp } from "./MobileAppContext";

export function PlaceDetailActions({
  place,
}: {
  place: {
    id: string;
    name: string;
    slug: string;
    placeType: string;
    barangayName?: string | null;
    featuredImageUrl?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
}) {
  const { draftStopIds, savedPlaceIds, addPlaceToActiveDraft, toggleBookmark, showToast } =
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
        // Fallback to copy
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Link copied", { tone: "info" });
    }
  };

  return (
    <>
      {/* Quiet Inline Map & Share Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-1.5 text-xs font-medium text-[#1A2421] hover:border-[#164237]/40 transition"
          >
            <MapPin className="w-3.5 h-3.5 text-[#1D7874]" />
            Open Map
            <ExternalLink className="w-3 h-3 text-[#616E69]" />
          </a>
        )}
        <button
          type="button"
          onClick={() => void handleShare()}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-1.5 text-xs font-medium text-[#1A2421] hover:border-[#164237]/40 transition cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-[#616E69]" />
          Share
        </button>
      </div>

      {/* Minimalist Sticky One-Thumb Bottom Action Bar */}
      <div className="no-print fixed bottom-[64px] left-1/2 -translate-x-1/2 w-full max-w-[430px] z-30 bg-white/95 backdrop-blur-md border-t border-[#EAE7E0] px-4 py-2.5 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => void toggleBookmark(place.id, place.name)}
          aria-label={saved ? "Remove from saved" : "Save offline"}
          className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition cursor-pointer ${
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
            className="flex-1 h-10 rounded-full bg-[#F3F2EE] text-[#164237] font-semibold text-xs flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            In My Trip • Open Planner
          </Link>
        ) : (
          <button
            type="button"
            onClick={() =>
              void addPlaceToActiveDraft({
                id: place.id,
                name: place.name,
                slug: place.slug,
                placeType: place.placeType,
                barangayName: place.barangayName ?? null,
                featuredImageUrl: place.featuredImageUrl ?? null,
                latitude: place.latitude ?? null,
                longitude: place.longitude ?? null,
              })
            }
            className="flex-1 h-10 rounded-full bg-[#164237] text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-[#10322A] transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add to Itinerary
          </button>
        )}
      </div>
    </>
  );
}
