"use client";

import dynamic from "next/dynamic";
import type { MapBarangayItem, MapPlaceItem } from "./SalcedoMap";

const SalcedoMap = dynamic(
  () => import("./SalcedoMap").then((m) => m.SalcedoMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[calc(100dvh-16.5rem)] min-h-[380px] rounded-2xl border border-[#E5E0D5] bg-white flex items-center justify-center text-xs text-[#5A6B66]">
        Loading Salcedo OpenStreetMap...
      </div>
    ),
  }
);

export function MapPageClient({
  places,
  barangays,
}: {
  places: MapPlaceItem[];
  barangays: MapBarangayItem[];
}) {
  return (
    <SalcedoMap
      places={places}
      barangays={barangays}
      heightClass="h-[calc(100dvh-16.5rem)] min-h-[380px]"
    />
  );
}
