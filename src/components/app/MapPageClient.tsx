"use client";

import dynamic from "next/dynamic";
import type { MapBarangayItem, MapPlaceItem } from "./SalcedoMap";

const SalcedoMap = dynamic(
  () => import("./SalcedoMap").then((m) => m.SalcedoMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[68vh] min-h-[440px] rounded-2xl border border-[#E5E0D5] bg-white flex items-center justify-center text-sm text-[#5A6B66]">
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
      heightClass="h-[68vh] min-h-[440px]"
    />
  );
}
