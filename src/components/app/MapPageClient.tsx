"use client";

import dynamic from "next/dynamic";
import type { PlaceCardData } from "./PlaceCard";
import type { MapBarangayItem } from "./SalcedoMap";

const SalcedoMap = dynamic(
  () => import("./SalcedoMap").then((m) => m.SalcedoMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[62vh] rounded-2xl border border-[#EAE7E0] bg-white flex items-center justify-center text-xs text-[#616E69]">
        Loading interactive Salcedo map...
      </div>
    ),
  }
);

export function MapPageClient({
  places,
  barangays,
}: {
  places: PlaceCardData[];
  barangays: MapBarangayItem[];
}) {
  return (
    <SalcedoMap
      places={places}
      barangays={barangays}
      heightClass="h-[62vh] min-h-[380px]"
    />
  );
}
