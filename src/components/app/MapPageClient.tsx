"use client";

import dynamic from "next/dynamic";
import type { PlaceCardData } from "./PlaceCard";
import type { MapBarangayItem } from "./SalcedoMap";

const SalcedoMap = dynamic(
  () => import("./SalcedoMap").then((m) => m.SalcedoMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#EAE6DC] flex items-center justify-center text-xs font-medium text-[#616E69]">
        Loading Salcedo map...
      </div>
    ),
  }
);

export function MapPageClient({
  places,
  barangays,
  initialPlaceSlug,
  autoRoute,
}: {
  places: PlaceCardData[];
  barangays: MapBarangayItem[];
  initialPlaceSlug?: string;
  autoRoute?: boolean;
}) {
  return (
    <SalcedoMap
      places={places}
      barangays={barangays}
      mode="fullscreen"
      initialPlaceSlug={initialPlaceSlug}
      autoRoute={autoRoute}
    />
  );
}
