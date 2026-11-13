import { getAllBarangaysWithCounts, getPublishedPlaces } from "@/lib/queries/public-tourism";
import { MapPageClient } from "@/components/app/MapPageClient";

export const dynamic = "force-dynamic";

export default async function InteractiveMapPage() {
  const [places, barangays] = await Promise.all([
    getPublishedPlaces(),
    getAllBarangaysWithCounts(),
  ]);

  return (
    <div className="px-4 py-4 space-y-3.5">
      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#616E69]">
          Explorer
        </p>
        <h1 className="font-display text-xl font-bold text-[#1A2421]">
          Salcedo Map
        </h1>
      </div>

      <MapPageClient places={places} barangays={barangays} />
    </div>
  );
}
