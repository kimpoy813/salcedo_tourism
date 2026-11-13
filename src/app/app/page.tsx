import Link from "next/link";
import {
  ChevronRight,
  Compass,
  MapPin,
  PhoneCall,
  Route,
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
    <div className="px-4 py-5 space-y-8">
      {/* 1. Minimalist Editorial Header & Search */}
      <section className="space-y-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#616E69]">
            Salcedo, Ilocos Sur
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1A2421] leading-snug">
            Waterfalls, springs &amp; quiet valley heritage.
          </h1>
        </div>

        <HomeSearchBar />

        {/* Quiet 4-Item Quick Navigation Row */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <Link
            href="/app/salcedo?tab=barangays"
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-white border border-[#EAE7E0] py-3 px-1 text-center hover:border-[#164237]/35 transition"
          >
            <MapPin className="w-4 h-4 text-[#164237]" strokeWidth={1.8} />
            <span className="text-[11px] font-semibold text-[#1A2421]">Barangays</span>
          </Link>
          <Link
            href="/app/trips"
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-white border border-[#EAE7E0] py-3 px-1 text-center hover:border-[#164237]/35 transition"
          >
            <Route className="w-4 h-4 text-[#164237]" strokeWidth={1.8} />
            <span className="text-[11px] font-semibold text-[#1A2421]">Plan Trip</span>
          </Link>
          <Link
            href="/app/salcedo?tab=products"
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-white border border-[#EAE7E0] py-3 px-1 text-center hover:border-[#164237]/35 transition"
          >
            <Trees className="w-4 h-4 text-[#164237]" strokeWidth={1.8} />
            <span className="text-[11px] font-semibold text-[#1A2421]">Products</span>
          </Link>
          <Link
            href="/app/salcedo?tab=emergency"
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-white border border-[#EAE7E0] py-3 px-1 text-center hover:border-[#164237]/35 transition"
          >
            <PhoneCall className="w-4 h-4 text-[#164237]" strokeWidth={1.8} />
            <span className="text-[11px] font-semibold text-[#1A2421]">Hotlines</span>
          </Link>
        </div>
      </section>

      {/* 2. Clean Editorial Valley Feature Card */}
      <Link
        href="/app/discover"
        className="block relative rounded-2xl overflow-hidden border border-[#EAE7E0] aspect-[16/9] bg-[#F3F2EE] group"
      >
        <img
          src="/images/salcedo/hero-salcedo-valley.png"
          alt="Valley and foothills of Salcedo, Ilocos Sur"
          className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between gap-2 text-white">
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/80">
              Rambutan Basket of the North
            </p>
            <p className="font-display text-base font-bold leading-snug">
              Explore 21 Official Barangays
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white text-[#1A2421] px-3 py-1.5 text-[11px] font-semibold shrink-0">
            <Compass className="w-3.5 h-3.5" />
            Directory
          </span>
        </div>
      </Link>

      {/* 3. Experience Categories (Hides empty categories) */}
      {nonEmptyCategories.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#1A2421]">
              Categories
            </h2>
            <Link
              href="/app/discover"
              className="text-xs font-medium text-[#616E69] hover:text-[#164237] inline-flex items-center gap-0.5"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
            {nonEmptyCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/app/discover?category=${encodeURIComponent(cat.slug)}`}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white border border-[#EAE7E0] px-3.5 py-1.5 text-xs font-medium text-[#1A2421] hover:border-[#164237] transition"
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

      {/* 4. Featured Attractions Rail */}
      {featuredAttractions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#1A2421]">
              Attractions &amp; Nature
            </h2>
            <Link
              href="/app/discover?type=attraction"
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

      {/* 5. Resorts & Inland Retreats Rail */}
      {featuredResorts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#1A2421]">
              Resorts &amp; Springs
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

      {/* 6. Curated Trails */}
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
                className="w-[244px] shrink-0 snap-start bg-white rounded-2xl border border-[#EAE7E0] p-4 flex flex-col justify-between gap-2 hover:border-[#D4CFC3] transition"
              >
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#616E69]">
                    Trail
                  </p>
                  <h3 className="font-display text-sm font-bold text-[#1A2421]">
                    {col.title}
                  </h3>
                  <p className="text-xs text-[#616E69] line-clamp-2 leading-relaxed">
                    {col.subtitle}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#164237]">
                  Explore →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 7. Dining & Hidden Gems */}
      {featuredDining.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#1A2421]">
              Local Dining
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

      {hiddenGems.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#1A2421]">
            Hidden Gems
          </h2>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-1">
            {hiddenGems.map((place) => (
              <PlaceCard key={place.id} place={place} variant="rail" />
            ))}
          </div>
        </section>
      )}

      {/* 8. Minimalist Barangay Index */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-[#1A2421]">
            Barangays
          </h2>
          <Link
            href="/app/salcedo?tab=barangays"
            className="text-xs font-medium text-[#616E69] hover:text-[#164237] inline-flex items-center gap-0.5"
          >
            All 21 <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-[#EAE7E0] grid grid-cols-2 divide-x divide-y divide-[#EAE7E0] overflow-hidden">
          {highlightedBarangays.map((b) => (
            <Link
              key={b.id}
              href={`/app/discover?barangay=${encodeURIComponent(b.slug)}`}
              className="p-3 hover:bg-[#FAF9F6] transition space-y-0.5"
            >
              <p className="font-display font-bold text-xs text-[#1A2421] truncate">
                {b.name}
              </p>
              <p className="text-[11px] text-[#616E69] tabular-nums">
                {b.publishedPlacesCount} {b.publishedPlacesCount === 1 ? "spot" : "spots"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 9. Festivals & Local Products */}
      {(events.length > 0 || products.length > 0) && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#1A2421]">
              Culture &amp; Harvest
            </h2>
            <Link
              href="/app/salcedo?tab=events"
              className="text-xs font-medium text-[#616E69] hover:text-[#164237] inline-flex items-center gap-0.5"
            >
              Explore <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-[#EAE7E0] divide-y divide-[#EAE7E0] overflow-hidden">
            {events.slice(0, 2).map((ev) => (
              <Link
                key={ev.id}
                href="/app/salcedo?tab=events"
                className="flex items-center justify-between gap-3 p-3.5 hover:bg-[#FAF9F6] transition"
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
                className="flex items-center gap-3 p-3.5 hover:bg-[#FAF9F6] transition"
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

      {/* 10. Quiet Account-Free / RA 10173 Colophon */}
      <Link
        href="/app/salcedo"
        className="flex items-center justify-between gap-3 rounded-2xl bg-white border border-[#EAE7E0] p-4 hover:border-[#D4CFC3] transition"
      >
        <div className="space-y-0.5 min-w-0">
          <p className="font-display text-sm font-bold text-[#1A2421]">
            Municipality of Salcedo (2711)
          </p>
          <p className="text-[11px] text-[#616E69]">
            Official guide • No login required • RA 10173 compliant
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-[#616E69] shrink-0" />
      </Link>
    </div>
  );
}
