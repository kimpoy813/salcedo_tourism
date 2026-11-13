import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Compass,
  MapPin,
  PhoneCall,
  Route,
  ShieldCheck,
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
    <div className="space-y-6 pb-4">
      {/* 1. Mobile App Hero Card */}
      <section className="relative overflow-hidden bg-[#0D3029] text-white rounded-b-[28px] shadow-md">
        <div className="absolute inset-0">
          <img
            src="/images/salcedo/hero-salcedo-valley.png"
            alt="Lush foothills and valley landscape of Salcedo, Ilocos Sur"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D3029] via-[#123F35]/75 to-[#0D3029]/45" />
        </div>

        <div className="relative px-4 pt-5 pb-6 space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/12 backdrop-blur-xs border border-[#D6A85B]/45 px-3 py-1 text-[11px] font-semibold text-[#F8F7F2]">
            <Sparkles className="w-3 h-3 text-[#D6A85B]" />
            <span>Rambutan Basket of the North</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold tracking-tight leading-[1.15]">
              Discover Salcedo&apos;s Waterfalls, Springs &amp; Warm Heritage.
            </h1>
            <p className="text-xs text-[#F8F7F2]/88 leading-relaxed">
              Explore 21 barangays, inland spring resorts, local tablea producers &amp; trip
              plans—no account required.
            </p>
          </div>

          <HomeSearchBar />

          <div className="grid grid-cols-2 gap-2.5 pt-0.5">
            <Link
              href="/app/discover"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#D6A85B] text-[#0D3029] px-3 py-2.5 text-xs font-bold shadow-sm active:scale-98 transition"
            >
              <Compass className="w-4 h-4" />
              Explore Spots
            </Link>
            <Link
              href="/app/trips"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/15 backdrop-blur-xs border border-white/30 text-white px-3 py-2.5 text-xs font-semibold active:scale-98 transition"
            >
              <Route className="w-4 h-4" />
              Plan My Trip
            </Link>
          </div>
        </div>
      </section>

      <div className="px-4 space-y-7">
        {/* 2. 2x2 Quick Municipal Action Grid */}
        <section className="grid grid-cols-2 gap-2.5">
          <Link
            href="/app/salcedo?tab=barangays"
            className="flex items-center gap-2.5 rounded-2xl bg-white border border-[#E5E0D5] p-3 shadow-2xs active:scale-98 transition"
          >
            <div className="w-9 h-9 rounded-xl bg-[#123F35]/10 text-[#123F35] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-xs text-[#202B28] truncate">
                21 Barangays
              </p>
              <p className="text-[10px] text-[#5A6B66] truncate">Atabay to Ubbog</p>
            </div>
          </Link>

          <Link
            href="/app/map"
            className="flex items-center gap-2.5 rounded-2xl bg-white border border-[#E5E0D5] p-3 shadow-2xs active:scale-98 transition"
          >
            <div className="w-9 h-9 rounded-xl bg-[#168A8A]/12 text-[#168A8A] flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-xs text-[#202B28] truncate">
                Salcedo Map
              </p>
              <p className="text-[10px] text-[#5A6B66] truncate">Pins &amp; guides</p>
            </div>
          </Link>

          <Link
            href="/app/salcedo?tab=products"
            className="flex items-center gap-2.5 rounded-2xl bg-white border border-[#E5E0D5] p-3 shadow-2xs active:scale-98 transition"
          >
            <div className="w-9 h-9 rounded-xl bg-[#D6A85B]/20 text-[#8C611B] flex items-center justify-center shrink-0">
              <Trees className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-xs text-[#202B28] truncate">
                Cacao &amp; Fruits
              </p>
              <p className="text-[10px] text-[#5A6B66] truncate">Local producers</p>
            </div>
          </Link>

          <Link
            href="/app/salcedo?tab=emergency"
            className="flex items-center gap-2.5 rounded-2xl bg-white border border-[#E5E0D5] p-3 shadow-2xs active:scale-98 transition"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-xs text-[#202B28] truncate">
                Hotlines
              </p>
              <p className="text-[10px] text-[#5A6B66] truncate">MDRRMO, PNP, RHU</p>
            </div>
          </Link>
        </section>

        {/* 3. Experience Category Pills (Hides empty categories) */}
        {nonEmptyCategories.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[#202B28]">
                Browse by Experience
              </h2>
              <Link
                href="/app/discover"
                className="text-xs font-bold text-[#168A8A] inline-flex items-center gap-0.5"
              >
                All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
              {nonEmptyCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/app/discover?category=${encodeURIComponent(cat.slug)}`}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white border border-[#E5E0D5] px-3.5 py-2 text-xs font-semibold text-[#202B28] hover:border-[#123F35] hover:bg-[#123F35] hover:text-white transition shadow-2xs"
                >
                  <span>{cat.name}</span>
                  <span className="text-[11px] opacity-65 tabular-nums">
                    {cat.publishedCount}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 4. Featured Attractions Horizontal Swipe Rail */}
        {featuredAttractions.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#168A8A]">
                  Nature, Falls &amp; Heritage
                </p>
                <h2 className="font-display text-lg font-bold text-[#202B28]">
                  Top Attractions
                </h2>
              </div>
              <Link
                href="/app/discover?type=attraction"
                className="text-xs font-bold text-[#123F35] inline-flex items-center gap-0.5 shrink-0"
              >
                See all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-1">
              {featuredAttractions.slice(0, 6).map((place) => (
                <PlaceCard key={place.id} place={place} variant="rail" />
              ))}
            </div>
          </section>
        )}

        {/* 5. Featured Resorts Horizontal Swipe Rail */}
        {featuredResorts.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#168A8A]">
                  Spring Pools &amp; Leisure
                </p>
                <h2 className="font-display text-lg font-bold text-[#202B28]">
                  Resorts &amp; Retreats
                </h2>
              </div>
              <Link
                href="/app/discover?type=resort"
                className="text-xs font-bold text-[#123F35] inline-flex items-center gap-0.5 shrink-0"
              >
                See all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-1">
              {featuredResorts.map((place) => (
                <PlaceCard key={place.id} place={place} variant="rail" />
              ))}
            </div>
          </section>
        )}

        {/* 6. Curated Salcedo Trails Horizontal Rail */}
        {editorial.collections.length > 0 && (
          <section className="space-y-2.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#168A8A]">
                Curated Trails
              </p>
              <h2 className="font-display text-lg font-bold text-[#202B28]">
                Explore by Theme
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-1">
              {editorial.collections.map((col) => (
                <Link
                  key={col.id}
                  href={`/app/discover?q=${encodeURIComponent(col.title.split(" ")[0])}`}
                  className="w-[260px] shrink-0 snap-start bg-white rounded-2xl border border-[#E5E0D5] p-4 flex flex-col justify-between gap-2.5 active:scale-98 transition"
                >
                  <div className="space-y-1.5">
                    <span className="inline-flex items-center rounded-full bg-[#123F35]/10 text-[#123F35] px-2 py-0.5 text-[10px] font-bold">
                      Curated Trail
                    </span>
                    <h3 className="font-display text-sm font-bold text-[#202B28]">
                      {col.title}
                    </h3>
                    <p className="text-xs text-[#5A6B66] line-clamp-2 leading-relaxed">
                      {col.subtitle}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-[#168A8A] inline-flex items-center gap-1">
                    Explore stops <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 7. Local Dining & Cafés Rail (Rendered only when published records exist) */}
        {featuredDining.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#168A8A]">
                  Verified Local Stops
                </p>
                <h2 className="font-display text-lg font-bold text-[#202B28]">
                  Local Eateries &amp; Dining
                </h2>
              </div>
              <Link
                href="/app/discover?type=restaurant"
                className="text-xs font-bold text-[#123F35] inline-flex items-center gap-0.5 shrink-0"
              >
                See all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-1">
              {featuredDining.map((place) => (
                <PlaceCard key={place.id} place={place} variant="rail" />
              ))}
            </div>
          </section>
        )}

        {/* 8. Hidden Gems Rail */}
        {hiddenGems.length > 0 && (
          <section className="space-y-2.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#B57E2E]">
                Off the Main Highway
              </p>
              <h2 className="font-display text-lg font-bold text-[#202B28]">
                Hidden Gems
              </h2>
            </div>
            <div className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-1">
              {hiddenGems.map((place) => (
                <PlaceCard key={place.id} place={place} variant="rail" />
              ))}
            </div>
          </section>
        )}

        {/* 9. Barangay Explorer Preview */}
        <section className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#168A8A]">
                All 21 Official Barangays
              </p>
              <h2 className="font-display text-base font-bold text-[#202B28]">
                Explore by Barangay
              </h2>
            </div>
            <Link
              href="/app/salcedo?tab=barangays"
              className="rounded-xl bg-[#123F35] text-white px-3 py-1.5 text-[11px] font-bold shrink-0"
            >
              All 21 →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {highlightedBarangays.map((b) => (
              <Link
                key={b.id}
                href={`/app/discover?barangay=${encodeURIComponent(b.slug)}`}
                className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] p-2.5 hover:border-[#168A8A] transition space-y-0.5"
              >
                <p className="font-display font-bold text-xs text-[#202B28] truncate">
                  {b.name}
                </p>
                <p className="text-[10px] font-semibold text-[#168A8A] tabular-nums">
                  {b.publishedPlacesCount} {b.publishedPlacesCount === 1 ? "spot" : "spots"}
                  {b.population2020 ? ` • Pop. ${b.population2020.toLocaleString()}` : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* 10. Festivals & Local Products */}
        {events.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#123F35]" />
                <h2 className="font-display text-base font-bold text-[#202B28]">
                  Festivals &amp; Events
                </h2>
              </div>
              <Link
                href="/app/salcedo?tab=events"
                className="text-xs font-bold text-[#168A8A]"
              >
                All Events →
              </Link>
            </div>
            <div className="space-y-2.5">
              {events.slice(0, 2).map((ev) => (
                <Link
                  key={ev.id}
                  href="/app/salcedo?tab=events"
                  className="block rounded-2xl bg-white border border-[#E5E0D5] p-3.5 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-[#168A8A] uppercase">
                    <span>{ev.category.replace("_", " ")}</span>
                    <span className="tabular-nums">{ev.startDate}</span>
                  </div>
                  <h3 className="font-display font-bold text-sm text-[#202B28]">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-[#5A6B66] line-clamp-2">{ev.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {products.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Trees className="w-4 h-4 text-[#123F35]" />
                <h2 className="font-display text-base font-bold text-[#202B28]">
                  Local Products
                </h2>
              </div>
              <Link
                href="/app/salcedo?tab=products"
                className="text-xs font-bold text-[#168A8A]"
              >
                See All →
              </Link>
            </div>
            <div className="space-y-2.5">
              {products.slice(0, 2).map((pr) => (
                <Link
                  key={pr.id}
                  href="/app/salcedo?tab=products"
                  className="flex gap-3 items-center rounded-2xl bg-white border border-[#E5E0D5] p-3"
                >
                  <img
                    src={pr.imageUrl || "/images/salcedo/rambutan-cacao-harvest.png"}
                    alt={pr.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 space-y-0.5">
                    <span className="text-[10px] font-bold text-[#168A8A] uppercase">
                      {pr.category}
                    </span>
                    <h3 className="font-display font-bold text-sm text-[#202B28] truncate">
                      {pr.name}
                    </h3>
                    <p className="text-xs text-[#5A6B66] line-clamp-1">{pr.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 11. Municipal Profile & Privacy Promise */}
        <section className="rounded-2xl bg-[#123F35] text-white p-4 flex items-center gap-3.5">
          <img
            src="/images/salcedo/seal-of-salcedo.png"
            alt="Salcedo Seal"
            className="w-12 h-12 rounded-full bg-white p-0.5 shrink-0"
          />
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#D6A85B]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RA 10173 Privacy • No Account Needed</span>
            </div>
            <p className="font-display text-sm font-bold leading-snug">
              Municipality of Salcedo (2711)
            </p>
            <p className="text-[11px] text-white/80 leading-snug">
              Official municipal history, travel guides &amp; emergency support.
            </p>
          </div>
          <Link
            href="/app/salcedo"
            className="rounded-xl bg-[#D6A85B] text-[#0D3029] px-3 py-2 text-xs font-bold shrink-0"
          >
            Info
          </Link>
        </section>
      </div>
    </div>
  );
}
