import { Suspense } from "react";
import {
  getAllBarangaysWithCounts,
  getPublishedArticlesAndGuides,
  getPublishedEvents,
  getPublishedProducts,
} from "@/lib/queries/public-tourism";
import { SalcedoInfoClient } from "@/components/app/SalcedoInfoClient";

import { PageIntro } from "@/components/ui/FieldGuide";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Salcedo visitor information" };
export const dynamic = "force-dynamic";

export default async function SalcedoInfoPage() {
  const [barangays, editorial, events, products] = await Promise.all([
    getAllBarangaysWithCounts(),
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
