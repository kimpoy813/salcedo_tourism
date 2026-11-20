import { Suspense } from "react";
import {
  getAllBarangaysWithCounts,
  getPublishedArticlesAndGuides,
  getPublishedEvents,
  getPublishedPlaces,
  getPublishedProducts,
} from "@/lib/queries/public-tourism";
import { SalcedoInfoClient } from "@/components/app/SalcedoInfoClient";

import { PageIntro } from "@/components/ui/FieldGuide";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Salcedo visitor information",
  description: "History, festivals, harvests and municipal information for visitors to Salcedo, Ilocos Sur.",
  path: "/app/salcedo",
});
export const dynamic = "force-dynamic";

export default async function SalcedoInfoPage() {
  const [barangays, places, editorial, events, products] = await Promise.all([
    getAllBarangaysWithCounts(),
    getPublishedPlaces(),
    getPublishedArticlesAndGuides(),
    getPublishedEvents(),
    getPublishedProducts(),
  ]);

  return (
    <div className="guide-wrap profile-page">
      <Link href="/app/more" className="back-link">
        <ArrowLeft size={15} />
        Local guide
      </Link>
      <PageIntro
        title="Salcedo, Ilocos Sur"
        description="Local history, barangay profiles, products, and emergency contacts."
        aside={
          <img
            src="/images/salcedo/municipal-seal.webp"
            width="78"
            height="78"
            alt="Official seal of Salcedo"
          />
        }
      />
      <Suspense
        fallback={
          <div className="px-4">
            <div className="rounded-2xl bg-white border border-[#EAE7E0] p-6 text-xs text-[#616E69]">
              Loading profile...
            </div>
          </div>
        }
      >
        <SalcedoInfoClient
          barangays={barangays}
          places={places}
          historicalArticles={editorial.historical}
          culturalArticles={editorial.cultural}
          events={events}
          products={products}
          guides={editorial.guides}
          contacts={editorial.contacts}
          municipalInfo={editorial.municipal}
        />
      </Suspense>
    </div>
  );
}
