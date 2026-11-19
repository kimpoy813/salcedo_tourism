import { getAllBarangaysWithCounts, getPublishedPlaces } from "@/lib/queries/public-tourism";
import { MapPageClient } from "@/components/app/MapPageClient";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Map explorer",
  description: "Explore Salcedo’s places, barangays, rivers and terrain on an offline-ready field map.",
  path: "/app/map",
});
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
