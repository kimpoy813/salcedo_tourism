import Link from "next/link";
import {
  ArrowRight,
  Calendar,
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
    <div className="space-y-12 pb-10">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-[#0D3029] text-white">
        <div className="absolute inset-0">
          <img
            src="/images/salcedo/hero-salcedo-valley.png"
            alt="Lush foothills and valley landscape of Salcedo, Ilocos Sur"
            className="w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D3029] via-[#123F35]/70 to-[#0D3029]/45" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-xs border border-[#D6A85B]/40 px-3.5 py-1 text-xs font-semibold text-[#F8F7F2]">
            <Sparkles className="w-3.5 h-3.5 text-[#D6A85B]" />
            <span>Municipality of Salcedo, Ilocos Sur • Formerly Baugen</span>
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight leading-[1.12]">
              Discover Salcedo&apos;s Waterfalls, Foothills &amp; Warm Heritage.
            </h1>
            <p className="text-sm sm:text-lg text-[#F8F7F2]/90 max-w-2xl leading-relaxed">
              Welcome to the <strong>Rambutan Basket of the North</strong>. Explore 21 barangays,
              spring-fed resorts, local cacao tablea producers, and custom trip plans—instant access,
              no account required.
            </p>
          </div>

          <HomeSearchBar />

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/app/discover"
              className="inline-flex items-center gap-2 rounded-xl bg-[#D6A85B] text-[#0D3029] px-5 py-3 text-sm font-bold shadow-md hover:bg-[#e1b76f] transition"
            >
              <Compass className="w-4 h-4" />
              Explore Salcedo
            </Link>
            <Link
              href="/app/trips"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-xs border border-white/30 text-white px-5 py-3 text-sm font-semibold hover:bg-white/25 transition"
            >
              <Route className="w-4 h-4" />
              Plan My Trip (No Login)
            </Link>
          </div>
        </div>
      </section>

      <div className="px-4 sm:px-6 space-y-12">
        {/* 2. Quick Category Navigation Pills (Hides empty categories) */}
        {nonEmptyCategories.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#202B28]">
                Browse by Experience
              </h2>
              <Link
                href="/app/discover"
                className="text-xs sm:text-sm font-semibold text-[#168A8A] hover:text-[#123F35] inline-flex items-center gap-1"
              >
                Full Directory <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {nonEmptyCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/app/discover?category=${encodeURIComponent(cat.slug)}`}
                  className="shrink-0 inline-flex items-center gap-2 rounded-2xl bg-white border border-[#E5E0D5] px-4 py-2.5 text-sm font-semibold text-[#202B28] hover:border-[#123F35] hover:bg-[#123F35] hover:text-white transition shadow-2xs"
                >
                  <span>{cat.name}</span>
                  <span className="text-xs opacity-70 tabular-nums">({cat.publishedCount})</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 3. Curated Salcedo Collections */}
        {editorial.collections.length > 0 && (
          <section className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#168A8A]">
                Curated Trails
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#202B28]">
                Explore Salcedo by Theme
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {editorial.collections.map((col) => (
                <Link
                  key={col.id}
                  href={`/app/discover?q=${encodeURIComponent(col.title.split(" ")[0])}`}
                  className="group bg-white rounded-2xl border border-[#E5E0D5] p-5 hover:border-[#168A8A]/50 hover:shadow-md transition flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <span className="inline-flex items-center rounded-full bg-[#123F35]/10 text-[#123F35] px-2.5 py-0.5 text-[11px] font-bold">
                      Municipal Collection
                    </span>
                    <h3 className="font-display text-lg font-bold text-[#202B28] group-hover:text-[#123F35]">
                      {col.title}
                    </h3>
                    <p className="text-sm text-[#5A6B66] leading-relaxed">{col.subtitle}</p>
                  </div>
                  <span className="text-xs font-bold text-[#168A8A] inline-flex items-center gap-1">
                    Explore spots <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 4. Featured Attractions & Nature Spots */}
        {featuredAttractions.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#168A8A]">
                  Nature, Falls &amp; Heritage
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#202B28]">
                  Top Attractions in Salcedo
                </h2>
              </div>
              <Link
                href="/app/discover?type=attraction"
                className="text-xs sm:text-sm font-semibold text-[#123F35] hover:underline shrink-0"
              >
                See all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredAttractions.slice(0, 6).map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          </section>
        )}

        {/* 5. Featured Resorts & Farms */}
        {featuredResorts.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#168A8A]">
                  Spring Pools &amp; Farm Leisure
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#202B28]">
                  Resorts &amp; Inland Retreats
                </h2>
              </div>
              <Link
                href="/app/discover?type=resort"
                className="text-xs sm:text-sm font-semibold text-[#123F35] hover:underline shrink-0"
              >
                See all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredResorts.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          </section>
        )}

        {/* 6. Featured Local Dining / Cafés (Rendered only when published records exist) */}
        {featuredDining.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#168A8A]">
                  Verified Local Stops
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#202B28]">
                  Local Eateries &amp; Dining
                </h2>
              </div>
              <Link
                href="/app/discover?type=restaurant"
                className="text-xs sm:text-sm font-semibold text-[#123F35] hover:underline shrink-0"
              >
                See all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredDining.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          </section>
        )}

        {/* 7. Hidden Gems */}
        {hiddenGems.length > 0 && (
          <section className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#D6A85B]">
                Off the Main Highway
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#202B28]">
                Hidden Gems of Salcedo
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {hiddenGems.map((place) => (
                <PlaceCard key={place.id} place={place} compact />
              ))}
            </div>
          </section>
        )}

        {/* 8. Barangay Explorer Preview */}
        <section className="bg-white rounded-3xl border border-[#E5E0D5] p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#168A8A]">
                All 21 Official Barangays
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#202B28]">
                Explore Salcedo Barangay by Barangay
              </h2>
              <p className="text-sm text-[#5A6B66] mt-1">
                From lowland Poblacion Norte &amp; Sur to upland Kinbandiw, Lucbuban, and Sorioan.
              </p>
            </div>
            <Link
              href="/app/salcedo?tab=barangays"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#123F35] text-white px-4 py-2.5 text-xs font-bold hover:bg-[#0D3029] transition shrink-0"
            >
              Explore All 21 Barangays →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {highlightedBarangays.map((b) => (
              <Link
                key={b.id}
                href={`/app/discover?barangay=${encodeURIComponent(b.slug)}`}
                className="rounded-2xl bg-[#F8F7F2] border border-[#E5E0D5] p-3.5 hover:border-[#168A8A] transition space-y-1"
              >
                <p className="font-display font-bold text-sm text-[#202B28] truncate">
                  {b.name}
                </p>
                <p className="text-[11px] text-[#5A6B66] tabular-nums">
                  {b.population2020 ? `Pop. ${b.population2020.toLocaleString()}` : "Barangay"}
                </p>
                <p className="text-[11px] font-semibold text-[#168A8A]">
                  {b.publishedPlacesCount} {b.publishedPlacesCount === 1 ? "spot" : "spots"}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* 9. Local Products & Festivals Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#123F35]" />
                  <h2 className="font-display text-xl font-bold text-[#202B28]">
                    Festivals &amp; Events
                  </h2>
                </div>
                <Link
                  href="/app/salcedo?tab=events"
                  className="text-xs font-bold text-[#168A8A] hover:underline"
                >
                  All Events →
                </Link>
              </div>
              <div className="space-y-3">
                {events.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-2xl bg-[#F8F7F2] border border-[#E5E0D5] p-4 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#168A8A]">
                      <span>{ev.category}</span>
                      <span className="tabular-nums">{ev.startDate}</span>
                    </div>
                    <h3 className="font-display font-bold text-base text-[#202B28]">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-[#5A6B66] line-clamp-2">{ev.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {products.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trees className="w-5 h-5 text-[#123F35]" />
                  <h2 className="font-display text-xl font-bold text-[#202B28]">
                    Local Products &amp; Delicacies
                  </h2>
                </div>
                <Link
                  href="/app/salcedo?tab=products"
                  className="text-xs font-bold text-[#168A8A] hover:underline"
                >
                  Explore Products →
                </Link>
              </div>
              <div className="space-y-3">
                {products.slice(0, 3).map((pr) => (
                  <div
                    key={pr.id}
                    className="flex gap-3.5 items-center rounded-2xl bg-[#F8F7F2] border border-[#E5E0D5] p-3.5"
                  >
                    <img
                      src={pr.imageUrl || "/images/salcedo/rambutan-cacao-harvest.png"}
                      alt={pr.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 space-y-0.5">
                      <span className="text-[11px] font-bold text-[#168A8A]">{pr.category}</span>
                      <h3 className="font-display font-bold text-sm text-[#202B28] truncate">
                        {pr.name}
                      </h3>
                      <p className="text-xs text-[#5A6B66] line-clamp-2">{pr.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 10. All About Salcedo + Emergency + Itinerary CTA */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            href="/app/salcedo"
            className="rounded-3xl bg-[#123F35] text-white p-6 space-y-3 hover:bg-[#0D3029] transition"
          >
            <img
              src="/images/salcedo/seal-of-salcedo.png"
              alt="Salcedo Seal"
              className="w-12 h-12 rounded-full bg-white p-0.5"
            />
            <h3 className="font-display text-xl font-bold">All About Salcedo</h3>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
              Learn about Salcedo&apos;s RA 1627 history (formerly Baugen), 103.44 km² landlocked
              profile, and cultural heritage.
            </p>
            <span className="inline-block text-xs font-bold text-[#D6A85B]">
              Read Municipal Profile →
            </span>
          </Link>

          <Link
            href="/app/map"
            className="rounded-3xl bg-white border border-[#E5E0D5] p-6 space-y-3 hover:border-[#168A8A] transition"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#168A8A]/12 text-[#168A8A] flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-[#202B28]">
              Interactive Salcedo Map
            </h3>
            <p className="text-xs sm:text-sm text-[#5A6B66] leading-relaxed">
              Browse waterfalls, resorts, churches, and all 21 barangay centers on OpenStreetMap—no
              forced location permissions.
            </p>
            <span className="inline-block text-xs font-bold text-[#168A8A]">
              Open Interactive Map →
            </span>
          </Link>

          <div className="rounded-3xl bg-white border border-[#E5E0D5] p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D6A85B]/20 text-[#9A6F26] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-[#202B28]">
              Plan Without an Account
            </h3>
            <p className="text-xs sm:text-sm text-[#5A6B66] leading-relaxed">
              Draft your custom itinerary locally, download or print freely, or submit your travel
              plan for an official CEDO trip code.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="/app/trips"
                className="inline-flex items-center gap-1 rounded-xl bg-[#123F35] text-white px-3.5 py-2 text-xs font-bold"
              >
                Start Trip Builder
              </Link>
              <Link
                href="/app/salcedo?tab=emergency"
                className="inline-flex items-center gap-1 rounded-xl border border-[#E5E0D5] px-3.5 py-2 text-xs font-semibold text-[#202B28]"
              >
                <PhoneCall className="w-3.5 h-3.5 text-rose-700" />
                Hotlines
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
