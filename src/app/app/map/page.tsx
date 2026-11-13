import { getAllBarangaysWithCounts, getPublishedPlaces } from "@/lib/queries/public-tourism";
import { MapPageClient } from "@/components/app/MapPageClient";

export const dynamic = "force-dynamic";

export default async function InteractiveMapPage() {
  const [places, barangays] = await Promise.all([
    getPublishedPlaces(),
    getAllBarangaysWithCounts(),
  ]);

  return (
    <div className="px-4 sm:px-6 py-8 space-y-5">
      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-[#168A8A]">
          OpenStreetMap Explorer
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#202B28]">
          Map of Salcedo, Ilocos Sur
        </h1>
        <p className="text-sm text-[#5A6B66] max-w-2xl">
          Centered on Salcedo Town Plaza (17.1507° N, 120.5361° E). Tap any pin for attraction
          details or toggle all 21 official barangays. Location sharing is strictly optional.
        </p>
      </div>

      <MapPageClient places={places} barangays={barangays} />
    </div>
  );
}
