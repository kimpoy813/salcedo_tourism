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
    <div className="px-4 py-4 space-y-4">
      <div className="space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#168A8A]">
          Official Municipal Guide
        </p>
        <h1 className="font-display text-xl font-bold text-[#202B28]">
          All About Salcedo, Ilocos Sur
        </h1>
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
