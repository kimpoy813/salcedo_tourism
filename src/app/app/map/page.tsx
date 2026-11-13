import { getAllBarangaysWithCounts, getPublishedPlaces } from "@/lib/queries/public-tourism";
import { MapPageClient } from "@/components/app/MapPageClient";

export const dynamic = "force-dynamic";

export default async function InteractiveMapPage({
  searchParams,
}: {
  searchParams: Promise<{ place?: string; route?: string }>;
}) {
  const [{ place, route }, places, barangays] = await Promise.all([
    searchParams,
    getPublishedPlaces(),
    getAllBarangaysWithCounts(),
  ]);

  return (
    <div className="w-full h-full">
      <MapPageClient
        places={places}
        barangays={barangays}
        initialPlaceSlug={place}
        autoRoute={route === "1"}
      />
    </div>
  );
}
