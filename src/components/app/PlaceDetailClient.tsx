"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Check, ExternalLink, MapPin, Plus } from "lucide-react";
import { trackPlaceView } from "@/lib/client/analytics-tracker";
import {
  listLocalDrafts,
  listSavedPlaceIds,
  saveLocalDraft,
  toggleSavedPlaceId,
} from "@/lib/client/indexeddb";

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
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    void trackPlaceView(place.id);
    listSavedPlaceIds().then((ids) => setSaved(ids.includes(place.id)));
  }, [place.id]);

  const handleToggleSave = async () => {
    const next = await toggleSavedPlaceId(place.id);
    setSaved(next);
  };

  const handleAddToItinerary = async () => {
    const drafts = await listLocalDrafts();
    const draft = drafts[0] ?? {
      id: `draft-${Date.now()}`,
      title: "My Salcedo Day Trip",
      plannedVisitDate: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
      description: "Planned using Project CEDO: Turi App",
      stops: [],
      updatedAt: new Date().toISOString(),
    };

    if (!draft.stops.some((s) => s.placeId === place.id)) {
      draft.stops.push({
        placeId: place.id,
        placeName: place.name,
        placeSlug: place.slug,
        placeType: place.placeType,
        barangayName: place.barangayName ?? null,
        featuredImageUrl: place.featuredImageUrl ?? null,
        latitude: place.latitude ?? null,
        longitude: place.longitude ?? null,
        visitTime: draft.stops.length === 0 ? "09:00" : "",
        durationMinutes: 90,
        personalNotes: "",
      });
      draft.updatedAt = new Date().toISOString();
      await saveLocalDraft(draft);
    }
    setAdded(true);
  };

  const mapsUrl =
    place.latitude && place.longitude
      ? `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=16/${place.latitude}/${place.longitude}`
      : null;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onClick={handleAddToItinerary}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition cursor-pointer ${
          added
            ? "bg-emerald-700 text-white"
            : "bg-[#123F35] text-white hover:bg-[#0D3029]"
        }`}
      >
        {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        {added ? "Added to Trip Draft" : "Add to My Itinerary"}
      </button>

      {added && (
        <Link
          href="/app/trips"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#D6A85B] text-[#0D3029] px-4 py-2.5 text-sm font-bold hover:bg-[#e1b76f] transition"
        >
          Open Trip Builder →
        </Link>
      )}

      <button
        type="button"
        onClick={handleToggleSave}
        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${
          saved
            ? "bg-[#D6A85B]/20 border-[#D6A85B] text-[#202B28]"
            : "bg-white border-[#E5E0D5] text-[#202B28] hover:bg-[#F8F7F2]"
        }`}
      >
        <Bookmark className="w-4 h-4" fill={saved ? "currentColor" : "none"} />
        {saved ? "Saved Offline" : "Save Place"}
      </button>

      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E0D5] bg-white px-4 py-2.5 text-sm font-semibold text-[#168A8A] hover:bg-[#F8F7F2] transition"
        >
          <MapPin className="w-4 h-4" />
          Coordinates
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}
