import { Suspense } from "react";
import {
  getAllBarangaysWithCounts,
  getPublishedArticlesAndGuides,
  getPublishedEvents,
  getPublishedProducts,
} from "@/lib/queries/public-tourism";
import { SalcedoInfoClient } from "@/components/app/SalcedoInfoClient";

export const dynamic = "force-dynamic";

export default async function SalcedoInfoPage() {
  const [barangays, editorial, events, products] = await Promise.all([
    getAllBarangaysWithCounts(),
    getPublishedArticlesAndGuides(),
    getPublishedEvents(),
    getPublishedProducts(),
  ]);

  return (
    <div className="py-4 space-y-3">
      <div className="px-4 flex items-center gap-3">
        <img
          src="/images/salcedo/seal-of-salcedo.png"
          alt="Official Seal of Salcedo, Ilocos Sur"
          className="w-11 h-11 rounded-full object-cover border border-[#EAE7E0] bg-white shrink-0"
        />
        <div className="space-y-0.5 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#616E69]">
            Municipality Profile
          </p>
          <h1 className="font-display text-xl font-bold text-[#1A2421] truncate">
            Salcedo, Ilocos Sur
          </h1>
        </div>
      </div>

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
