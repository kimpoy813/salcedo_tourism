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
      showToast("Link copied to clipboard", { tone: "info" });
    }
  };

  return (
    <>
      {/* Quick inline GPS & Share chips */}
      <div className="flex flex-wrap items-center gap-2">
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-xs font-bold text-[#168A8A]"
          >
            <MapPin className="w-3.5 h-3.5" />
            Open in Map
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        <button
          type="button"
          onClick={() => void handleShare()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-xs font-bold text-[#202B28] cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
      </div>

      {/* Sticky One-Thumb Bottom Action Bar (above 5-tab bar) */}
      <div className="no-print fixed bottom-[64px] left-1/2 -translate-x-1/2 w-full max-w-[440px] z-30 bg-white/95 backdrop-blur-md border-t border-[#E5E0D5] px-4 py-2.5 flex items-center gap-2 shadow-[0_-4px_16px_rgba(18,63,53,0.06)]">
        <button
          type="button"
          onClick={() => void toggleBookmark(place.id, place.name)}
          aria-label={saved ? "Remove from saved places" : "Save place offline"}
          className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition cursor-pointer ${
            saved
              ? "bg-[#D6A85B]/20 border-[#D6A85B] text-[#8C611B]"
              : "bg-[#F8F7F2] border-[#E5E0D5] text-[#202B28]"
          }`}
        >
          <Bookmark className="w-5 h-5" fill={saved ? "currentColor" : "none"} />
        </button>

        {inDraft ? (
          <Link
            href="/app/trips"
            className="flex-1 h-11 rounded-xl bg-[#D6A85B] text-[#0D3029] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Check className="w-4 h-4" />
            In My Trip • View Builder →
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
            className="flex-1 h-11 rounded-xl bg-[#123F35] text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#0D3029] transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add to My Itinerary
          </button>
        )}
      </div>
    </>
  );
}
