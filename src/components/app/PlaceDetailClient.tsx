"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, Check, ExternalLink, MapPin, Plus, Share2 } from "lucide-react";
import { trackPlaceView } from "@/lib/client/analytics-tracker";
import { useMobileApp } from "./MobileAppContext";

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
