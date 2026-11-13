import Link from "next/link";
import {
  ChevronRight,
  Compass,
  Coffee,
  Map as MapIcon,
  MapPin,
  PhoneCall,
  Route,
  Sparkles,
  Trees,
} from "lucide-react";
import {
  getAllBarangaysWithCounts,
  getCategoriesWithCounts,
  getPublishedArticlesAndGuides,
  getPublishedEvents,
  getPublishedPlaces,
  getPublishedProducts,
} from "@/lib/queries/public-tourism";
import { HomeSearchBar } from "@/components/app/HomeSearchBar";
import { PlaceCard } from "@/components/app/PlaceCard";

export const dynamic = "force-dynamic";

export default async function TouristHomePage() {
  const [places, categories, barangays, events, products, editorial] = await Promise.all([
    getPublishedPlaces(),
    getCategoriesWithCounts(),
    getAllBarangaysWithCounts(),
    getPublishedEvents(),
    getPublishedProducts(),
    getPublishedArticlesAndGuides(),
  ]);

  const nonEmptyCategories = categories.filter((c) => c.publishedCount > 0);
  const spotlightPlaces = places.filter((p) => p.isFeatured).slice(0, 5);
  const featuredAttractions = places.filter((p) =>
    ["attraction", "nature", "heritage"].includes(p.placeType)
  );
  const featuredResorts = places.filter(
    (p) => p.placeType === "resort" || p.placeType === "accommodation"
  );
  const featuredDining = places.filter(
    (p) => p.placeType === "restaurant" || p.placeType === "cafe"
  );
  const hiddenGems = places.filter((p) => p.isHiddenGem);
  const highlightedBarangays = barangays
    .filter((b) => b.publishedPlacesCount > 0 || b.name.includes("Poblacion"))
    .slice(0, 6);

  return (
    <div className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-6 space-y-7">
      {/* 1. Native App Location Bar + Large Title */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 min-w-0">
            <img
              src="/images/salcedo/seal-of-salcedo.png"
              alt="Salcedo Seal"
              className="w-7 h-7 rounded-full object-contain shrink-0 border border-[#EAE7E0] bg-white"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-[#164237] leading-none">
                Salcedo, Ilocos Sur
              </p>
              <p className="text-[10px] text-[#616E69] mt-0.5 tabular-nums">
                {places.length} spots • 21 barangays
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

        <h1 className="font-display text-[26px] font-bold tracking-tight text-[#1A2421] leading-[1.15]">
          Explore Salcedo
        </h1>

        <HomeSearchBar />

        {/* Horizontal Story-Style Quick Actions */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pt-1">
          <Link
            href="/app/map"
            className="flex flex-col items-center gap-1.5 shrink-0 w-16 text-center active:scale-95 transition"
          >
            <span className="w-12 h-12 rounded-2xl bg-[#164237] text-white flex items-center justify-center shadow-xs">
              <MapIcon className="w-5 h-5" strokeWidth={1.8} />
            </span>
            <span className="text-[11px] font-semibold text-[#1A2421]">Salcedo Map</span>
          </Link>
          <Link
            href="/app/trips"
            className="flex flex-col items-center gap-1.5 shrink-0 w-16 text-center active:scale-95 transition"
          >
            <span className="w-12 h-12 rounded-2xl bg-white border border-[#EAE7E0] text-[#164237] flex items-center justify-center">
              <Route className="w-5 h-5" strokeWidth={1.8} />
            </span>
            <span className="text-[11px] font-semibold text-[#1A2421]">Plan Trip</span>
          </Link>
          <Link
            href="/app/salcedo?tab=barangays"
            className="flex flex-col items-center gap-1.5 shrink-0 w-16 text-center active:scale-95 transition"
          >
            <span className="w-12 h-12 rounded-2xl bg-white border border-[#EAE7E0] text-[#1D7874] flex items-center justify-center">
              <MapPin className="w-5 h-5" strokeWidth={1.8} />
            </span>
            <span className="text-[11px] font-semibold text-[#1A2421]">Barangays</span>
          </Link>
          <Link
            href="/app/discover?category=cafes-coffee"
            className="flex flex-col items-center gap-1.5 shrink-0 w-16 text-center active:scale-95 transition"
          >
            <span className="w-12 h-12 rounded-2xl bg-white border border-[#EAE7E0] text-[#9E6340] flex items-center justify-center">
              <Coffee className="w-5 h-5" strokeWidth={1.8} />
            </span>
            <span className="text-[11px] font-semibold text-[#1A2421]">Cafés</span>
          </Link>
          <Link
            href="/app/salcedo?tab=products"
            className="flex flex-col items-center gap-1.5 shrink-0 w-16 text-center active:scale-95 transition"
          >
            <span className="w-12 h-12 rounded-2xl bg-white border border-[#EAE7E0] text-[#B88A44] flex items-center justify-center">
              <Trees className="w-5 h-5" strokeWidth={1.8} />
            </span>
            <span className="text-[11px] font-semibold text-[#1A2421]">Harvests</span>
          </Link>
          <Link
            href="/app/salcedo?tab=emergency"
            className="flex flex-col items-center gap-1.5 shrink-0 w-16 text-center active:scale-95 transition"
          >
            <span className="w-12 h-12 rounded-2xl bg-white border border-[#EAE7E0] text-rose-700 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" strokeWidth={1.8} />
            </span>
            <span className="text-[11px] font-semibold text-[#1A2421]">Hotlines</span>
          </Link>
        </div>
      </section>

      {/* 2. Snap-Peek Featured Spotlight Carousel */}
      {spotlightPlaces.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#1A2421] inline-flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#B88A44]" />
              Featured Spots
            </h2>
            <Link
              href="/app/discover"
              className="text-xs font-semibold text-[#164237] inline-flex items-center gap-0.5"
            >
              All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-1">
            {spotlightPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} variant="spotlight" />
            ))}
          </div>
        </section>
      )}

      {/* 3. Experience Categories Pills */}
      {nonEmptyCategories.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#1A2421]">
              Browse by Category
            </h2>
            <Link
              href="/app/discover"
              className="text-xs font-medium text-[#616E69] hover:text-[#164237] inline-flex items-center gap-0.5"
            >
              Directory <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
            {nonEmptyCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/app/discover?category=${encodeURIComponent(cat.slug)}`}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white border border-[#EAE7E0] px-3.5 py-2 text-xs font-semibold text-[#1A2421] active:scale-95 transition"
              >
                <span>{cat.name}</span>
                <span className="text-[11px] text-[#616E69] tabular-nums">
                  {cat.publishedCount}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 4. Waterfalls, Nature & Heritage */}
      {featuredAttractions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#1A2421]">
              Waterfalls &amp; Heritage
            </h2>
            <Link
              href="/app/discover?type=nature"
              className="text-xs font-medium text-[#616E69] hover:text-[#164237] inline-flex items-center gap-0.5"
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-1">
            {featuredAttractions.slice(0, 6).map((place) => (
              <PlaceCard key={place.id} place={place} variant="rail" />
            ))}
          </div>
        </section>
      )}

      {/* 5. Resorts, Springs & Stays */}
      {featuredResorts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#1A2421]">
              Springs &amp; Stays
            </h2>
            <Link
              href="/app/discover?type=resort"
              className="text-xs font-medium text-[#616E69] hover:text-[#164237] inline-flex items-center gap-0.5"
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-1">
            {featuredResorts.map((place) => (
              <PlaceCard key={place.id} place={place} variant="rail" />
            ))}
          </div>
        </section>
      )}

      {/* 6. Cafés & Local Dining */}
      {featuredDining.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#1A2421]">
              Cafés &amp; Local Eats
            </h2>
            <Link
              href="/app/discover?type=restaurant"
              className="text-xs font-medium text-[#616E69] hover:text-[#164237] inline-flex items-center gap-0.5"
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-1">
            {featuredDining.map((place) => (
              <PlaceCard key={place.id} place={place} variant="rail" />
            ))}
          </div>
        </section>
      )}

      {/* 7. Curated Trails */}
      {editorial.collections.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#1A2421]">
            Curated Trails
          </h2>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-1">
            {editorial.collections.map((col) => (
              <Link
                key={col.id}
                href={`/app/discover?q=${encodeURIComponent(col.title.split(" ")[0])}`}
                className="w-[238px] shrink-0 snap-start bg-white rounded-2xl border border-[#EAE7E0] overflow-hidden active:scale-[0.985] transition"
              >
                <div className="aspect-[16/9] bg-[#F3F2EE]">
                  <img
                    src={col.coverImageUrl || "/images/salcedo/hero-salcedo-valley.png"}
                    alt={col.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-3.5 space-y-1">
                  <h3 className="font-display text-sm font-bold text-[#1A2421] line-clamp-1">
                    {col.title}
                  </h3>
                  <p className="text-xs text-[#616E69] line-clamp-2 leading-relaxed">
                    {col.subtitle}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 8. Hidden Gems */}
      {hiddenGems.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#1A2421]">
            Quiet Hidden Gems
          </h2>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-1">
            {hiddenGems.map((place) => (
              <PlaceCard key={place.id} place={place} variant="rail" />
            ))}
          </div>
        </section>
      )}

      {/* 9. Barangays Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-[#1A2421]">
            Across 21 Barangays
          </h2>
          <Link
            href="/app/salcedo?tab=barangays"
            className="text-xs font-semibold text-[#164237] inline-flex items-center gap-0.5"
          >
            All 21 <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-[#EAE7E0] grid grid-cols-2 divide-x divide-y divide-[#EAE7E0] overflow-hidden">
          {highlightedBarangays.map((b) => (
            <Link
              key={b.id}
              href={`/app/discover?barangay=${encodeURIComponent(b.slug)}`}
              className="p-3.5 active:bg-[#F3F2EE] transition space-y-0.5"
            >
              <p className="font-display font-bold text-xs text-[#1A2421] truncate">
                Brgy. {b.name}
              </p>
              <p className="text-[11px] text-[#616E69] tabular-nums">
                {b.publishedPlacesCount} {b.publishedPlacesCount === 1 ? "spot" : "spots"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 10. Festivals & Local Harvests Inset Group */}
      {(events.length > 0 || products.length > 0) && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#1A2421]">
              Culture &amp; Harvest
            </h2>
            <Link
              href="/app/salcedo?tab=events"
              className="text-xs font-semibold text-[#164237] inline-flex items-center gap-0.5"
            >
              Explore <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-[#EAE7E0] divide-y divide-[#EAE7E0] overflow-hidden">
            {events.slice(0, 2).map((ev) => (
              <Link
                key={ev.id}
                href="/app/salcedo?tab=events"
                className="flex items-center justify-between gap-3 p-3.5 active:bg-[#F3F2EE] transition"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#616E69]">
                    Event • {ev.startDate}
                  </p>
                  <p className="font-display font-bold text-sm text-[#1A2421] truncate">
                    {ev.title}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#616E69] shrink-0" />
              </Link>
            ))}
            {products.slice(0, 2).map((pr) => (
              <Link
                key={pr.id}
                href="/app/salcedo?tab=products"
                className="flex items-center gap-3 p-3.5 active:bg-[#F3F2EE] transition"
              >
                <img
                  src={pr.imageUrl || "/images/salcedo/rambutan-cacao-harvest.png"}
                  alt={pr.name}
                  className="w-11 h-11 rounded-xl object-cover shrink-0 bg-[#F3F2EE]"
                />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#616E69]">
                    Local Product
                  </p>
                  <p className="font-display font-bold text-sm text-[#1A2421] truncate">
                    {pr.name}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#616E69] shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 11. Account-Free App Badge */}
      <Link
        href="/app/salcedo"
        className="flex items-center justify-between gap-3 rounded-2xl bg-white border border-[#EAE7E0] p-4 active:bg-[#F3F2EE] transition"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-full bg-[#164237]/10 text-[#164237] flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-[#1A2421]">
              Municipality of Salcedo (2711)
            </p>
            <p className="text-[11px] text-[#616E69]">
              Account-free guide • RA 10173 compliant
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[#616E69] shrink-0" />
      </Link>
    </div>
  );
}
