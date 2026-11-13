import Link from "next/link";
import { ChevronRight, Map as MapIcon, Sparkles } from "lucide-react";
import {
  getCategoriesWithCounts,
  getPublishedEvents,
  getPublishedPlaces,
  getPublishedProducts,
} from "@/lib/queries/public-tourism";
import { HomeSearchBar } from "@/components/app/HomeSearchBar";
import { HomeRankingsCard } from "@/components/app/HomeRankingsCard";
import { PlaceCard } from "@/components/app/PlaceCard";

export const dynamic = "force-dynamic";

export default async function TouristHomePage() {
  const [places, categories, events, products] = await Promise.all([
    getPublishedPlaces({ sort: "most_visited" }),
    getCategoriesWithCounts(),
    getPublishedEvents(),
    getPublishedProducts(),
  ]);

  const nonEmptyCategories = categories.filter((c) => c.publishedCount > 0);
  const spotlightPlaces = places.filter((p) => p.isFeatured).slice(0, 5);
  const nextEvent = events[0] ?? null;
  const featuredProduct = products[0] ?? null;

  return (
    <div className="w-full max-w-full min-w-0 pt-[max(16px,env(safe-area-inset-top))] pb-7 space-y-6">
      {/* 1. Clean App Header, Brand & Search */}
      <section className="px-4 space-y-3.5">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/images/salcedo/turi-logo.png"
              alt="Project CEDO: Turi Logo"
              className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-xs border border-[#164237]/15"
            />
            <div className="min-w-0">
              <h1 className="font-display text-lg font-bold tracking-tight text-[#1A2421] truncate leading-tight">
                Project CEDO: Turi
              </h1>
              <p className="text-[11px] font-semibold text-[#164237] truncate">
                Salcedo, Ilocos Sur
              </p>
            </div>
          </div>
          <Link
            href="/app/map"
            className="inline-flex items-center gap-1 rounded-full bg-white border border-[#EAE7E0] px-3 py-1.5 text-[11px] font-semibold text-[#164237] active:scale-95 transition shrink-0"
          >
            <MapIcon className="w-3.5 h-3.5" />
            Map
          </Link>
        </div>

        <HomeSearchBar />
      </section>

      {/* 2. Top Ranked Places Immediately Visible Above the Fold */}
      {places.length > 0 && (
        <div className="px-4">
          <HomeRankingsCard places={places} categories={categories} />
        </div>
      )}

      {/* 3. Featured Spotlight Carousel (Full-Width Track With Symmetric 16px Ends) */}
      {spotlightPlaces.length > 0 && (
        <section className="w-full min-w-0 space-y-3">
          <div className="px-4 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-[#1A2421] inline-flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#B88A44] shrink-0" />
              Featured Spots
            </h2>
            <Link
              href="/app/discover"
              className="text-xs font-semibold text-[#164237] inline-flex items-center gap-0.5 shrink-0"
            >
              All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="w-full flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar px-4 scroll-px-4 pb-1 after:content-[''] after:w-1 after:shrink-0">
            {spotlightPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                variant="spotlight"
                rankBadge={{ rank: place.mostVisitedRank }}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Clean 2-Column Category Grid */}
      {nonEmptyCategories.length > 0 && (
        <section className="px-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-[#1A2421]">
              Categories
            </h2>
            <Link
              href="/app/discover?sort=by_category"
              className="text-xs font-semibold text-[#164237] inline-flex items-center gap-0.5 shrink-0"
            >
              Browse <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {nonEmptyCategories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                href={`/app/discover?category=${encodeURIComponent(cat.slug)}`}
                className="bg-white rounded-2xl border border-[#EAE7E0] p-3.5 flex flex-col justify-between gap-1 active:bg-[#F3F2EE] transition min-w-0"
              >
                <p className="font-display font-bold text-xs text-[#1A2421] truncate">
                  {cat.name}
                </p>
                <p className="text-[11px] text-[#616E69] tabular-nums">
                  {cat.publishedCount} {cat.publishedCount === 1 ? "spot" : "spots"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 5. Minimal Local Culture & Harvest Strip */}
      {(nextEvent || featuredProduct) && (
        <section className="px-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-[#1A2421]">
              Events &amp; Harvest
            </h2>
            <Link
              href="/app/salcedo?tab=events"
              className="text-xs font-semibold text-[#164237] inline-flex items-center gap-0.5 shrink-0"
            >
              Guide <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-[#EAE7E0] divide-y divide-[#EAE7E0] overflow-hidden">
            {nextEvent && (
              <Link
                href="/app/salcedo?tab=events"
                className="flex items-center justify-between gap-3 p-3.5 active:bg-[#F3F2EE] transition"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#616E69]">
                    Event • {nextEvent.startDate}
                  </p>
                  <p className="font-display font-bold text-sm text-[#1A2421] truncate">
                    {nextEvent.title}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#616E69] shrink-0" />
              </Link>
            )}
            {featuredProduct && (
              <Link
                href="/app/salcedo?tab=products"
                className="flex items-center gap-3 p-3.5 active:bg-[#F3F2EE] transition"
              >
                <img
                  src={featuredProduct.imageUrl || "/images/salcedo/rambutan-cacao-harvest.png"}
                  alt={featuredProduct.name}
                  className="w-10 h-10 rounded-xl object-cover shrink-0 bg-[#F3F2EE]"
                />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#616E69]">
                    Local Harvest
                  </p>
                  <p className="font-display font-bold text-sm text-[#1A2421] truncate">
                    {featuredProduct.name}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#616E69] shrink-0" />
              </Link>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
