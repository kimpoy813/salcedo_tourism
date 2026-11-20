import { Suspense } from "react";
import {
  getAllBarangaysWithCounts,
  getCategoriesWithCounts,
  getPublishedPlaces,
} from "@/lib/queries/public-tourism";
import { DiscoverDirectoryClient } from "@/components/app/DiscoverDirectoryClient";
import { PageIntro } from "@/components/ui/FieldGuide";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "Discover places",
  description: "Waterfalls, resorts, heritage sites and local food in Salcedo, Ilocos Sur — filter by interest, barangay or rating.",
  path: "/app/discover",
});

export default async function DiscoverPage() {
  const [places, categories, barangays] = await Promise.all([
    getPublishedPlaces(),
    getCategoriesWithCounts(),
    getAllBarangaysWithCounts(),
  ]);
  return (
    <div className="guide-wrap directory-page">
      <PageIntro
        title="Place directory"
        description="Look up a destination by name, interest, or barangay."
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
