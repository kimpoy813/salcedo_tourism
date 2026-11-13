import { Suspense } from "react";
import {
  getAllBarangaysWithCounts,
  getCategoriesWithCounts,
  getPublishedPlaces,
} from "@/lib/queries/public-tourism";
import { DiscoverDirectoryClient } from "@/components/app/DiscoverDirectoryClient";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const [places, categories, barangays] = await Promise.all([
    getPublishedPlaces(),
    getCategoriesWithCounts(),
    getAllBarangaysWithCounts(),
  ]);

  return (
    <div className="px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-[#168A8A]">
          Municipality of Salcedo Directory
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#202B28]">
          Discover Salcedo
        </h1>
        <p className="text-sm text-[#5A6B66] max-w-2xl">
          Verified waterfalls, inland spring resorts, local eateries, heritage landmarks, local
          producers, and essential visitor stops across all 21 barangays.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="rounded-3xl bg-white border border-[#E5E0D5] p-8 text-sm text-[#5A6B66]">
            Loading Salcedo directory...
          </div>
        }
      >
        <DiscoverDirectoryClient
          initialPlaces={places}
          categories={categories}
          barangays={barangays}
        />
      </Suspense>
    </div>
  );
}
