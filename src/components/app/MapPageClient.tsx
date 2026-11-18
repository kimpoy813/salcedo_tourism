"use client";

import { BrowserAtlas } from "./BrowserAtlas";
import { useSearchParams } from "next/navigation";
import type { PlaceCardData } from "./PlaceCard";
import type { MapBarangayItem } from "@/lib/geo/atlas";

export function MapPageClient({
  places,
  barangays,
}: {
  places: PlaceCardData[];
  barangays: MapBarangayItem[];
}) {
  const place = useSearchParams().get("place") || undefined;
  return (
    <BrowserAtlas
      key={place}
      places={places}
      barangays={barangays}
      mode="fullscreen"
      initialPlaceSlug={place}
    />
  );
}
