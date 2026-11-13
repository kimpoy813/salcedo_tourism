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
    <div className="px-4 py-4 space-y-4">
      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#616E69]">
          Directory
        </p>
        <h1 className="font-display text-xl font-bold text-[#1A2421]">
          Discover Salcedo
        </h1>
      </div>

      <Suspense
        fallback={
          <div className="rounded-2xl bg-white border border-[#EAE7E0] p-6 text-xs text-[#616E69]">
            Loading directory...
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
