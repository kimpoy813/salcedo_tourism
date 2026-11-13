import { getAllBarangaysWithCounts, getPublishedPlaces } from "@/lib/queries/public-tourism";
import { MapPageClient } from "@/components/app/MapPageClient";

export const dynamic = "force-dynamic";

export default async function InteractiveMapPage() {
  const [places, barangays] = await Promise.all([
    getPublishedPlaces(),
    getAllBarangaysWithCounts(),
  ]);

  return (
    <div className="w-full h-full">
      <MapPageClient places={places} barangays={barangays} />
    </div>
  );
}
