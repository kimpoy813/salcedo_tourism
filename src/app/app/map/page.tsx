import { getAllBarangaysWithCounts, getPublishedPlaces } from "@/lib/queries/public-tourism";
import { MapPageClient } from "@/components/app/MapPageClient";

export const dynamic = "force-dynamic";

export default async function InteractiveMapPage() {
  const [places, barangays] = await Promise.all([
    getPublishedPlaces(),
    getAllBarangaysWithCounts(),
  ]);

  return (
    <div className="px-4 py-4 space-y-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#168A8A]">
            OpenStreetMap Explorer
          </p>
          <h1 className="font-display text-xl font-bold text-[#202B28]">
            Map of Salcedo
          </h1>
        </div>
        <span className="text-[10px] font-medium text-[#5A6B66] tabular-nums">
          17.15°N, 120.54°E
        </span>
      </div>

      <MapPageClient places={places} barangays={barangays} />
    </div>
  );
}
