import { Suspense } from "react";
import {
  getAllBarangaysWithCounts,
  getCategoriesWithCounts,
  getPublishedPlaces,
} from "@/lib/queries/public-tourism";
import { DiscoverDirectoryClient } from "@/components/app/DiscoverDirectoryClient";
import { FieldStamp, PageIntro } from "@/components/ui/FieldGuide";

export const dynamic = "force-dynamic";
export const metadata = { title: "Discover places" };

export default async function DiscoverPage() {
  const [places, categories, barangays] = await Promise.all([
    getPublishedPlaces(),
    getCategoriesWithCounts(),
    getAllBarangaysWithCounts(),
  ]);
  return (
    <div className="guide-wrap directory-page">
      <PageIntro
        eyebrow="The place directory"
        title="Discover Salcedo"
        description="Find a mountain escape, a table for lunch, or your next place to stay."
        aside={<FieldStamp />}
      />
      <Suspense
        fallback={
          <p className="empty-note" role="status">
            Loading the directory…
          </p>
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
