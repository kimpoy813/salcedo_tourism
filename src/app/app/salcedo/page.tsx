import {
  getAllBarangaysWithCounts,
  getPublishedArticlesAndGuides,
  getPublishedEvents,
  getPublishedProducts,
} from "@/lib/queries/public-tourism";
import { SalcedoInfoClient } from "@/components/app/SalcedoInfoClient";

export const dynamic = "force-dynamic";

export default async function SalcedoInfoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const [barangays, editorial, events, products] = await Promise.all([
    getAllBarangaysWithCounts(),
    getPublishedArticlesAndGuides(),
    getPublishedEvents(),
    getPublishedProducts(),
  ]);

  return (
    <div className="px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-[#168A8A]">
          Official Municipal Knowledge Base
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#202B28]">
          All About Salcedo, Ilocos Sur
        </h1>
        <p className="text-sm text-[#5A6B66] max-w-2xl">
          Verified municipal profile, history from Baugen to Salcedo (RA 1627), all 21 official
          barangays, agricultural delicacies, events, and municipal emergency hotlines.
        </p>
      </div>

      <SalcedoInfoClient
        initialTab={sp.tab || "overview"}
        barangays={barangays}
        historicalArticles={editorial.historical}
        culturalArticles={editorial.cultural}
        events={events}
        products={products}
        guides={editorial.guides}
        contacts={editorial.contacts}
        municipalInfo={editorial.municipal}
      />
    </div>
  );
}
