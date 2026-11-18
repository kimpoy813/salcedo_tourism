"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import type { PlaceCardData } from "./PlaceCard";
import type { MapBarangayItem } from "./SalcedoMap";

const SalcedoMap = dynamic(
  // Keep Leaflet browser-only but include the atlas in the precached map route.
  () => import(/* webpackMode: "eager" */ "./SalcedoMap").then((m) => m.SalcedoMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#EAE6DC] flex items-center justify-center text-xs font-medium text-[#616E69]">
        Loading Salcedo map...
      </div>
    ),
  },
);

export function MapPageClient({
  places,
  barangays,
}: {
  places: PlaceCardData[];
  barangays: MapBarangayItem[];
}) {
  const place = useSearchParams().get("place") || undefined;
  return (
    <SalcedoMap
      key={place}
      places={places}
      barangays={barangays}
      mode="fullscreen"
      initialPlaceSlug={place}
    />
  );
}
