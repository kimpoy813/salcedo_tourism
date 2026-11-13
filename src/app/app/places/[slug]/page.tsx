import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coffee,
  Compass,
  ExternalLink,
  Globe,
  Info,
  MapPin,
  Phone,
  ShieldAlert,
  Trees,
  Utensils,
  Waves,
  Wifi,
  Car,
} from "lucide-react";
import { getPublishedPlaceByIdOrSlug } from "@/lib/queries/public-tourism";
import { PlaceDetailActions } from "@/components/app/PlaceDetailClient";
import { PlaceCard } from "@/components/app/PlaceCard";

export const dynamic = "force-dynamic";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const place = await getPublishedPlaceByIdOrSlug(slug);
  if (!place) {
    notFound();
  }

  const imageSrc = place.featuredImageUrl || "/images/salcedo/hero-salcedo-valley.png";

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Breadcrumb Back Link */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/app/discover"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#123F35] hover:text-[#168A8A] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discover Salcedo
        </Link>
        {place.barangay && (
          <Link
            href={`/app/discover?barangay=${encodeURIComponent(place.barangay.slug)}`}
            className="text-xs font-semibold text-[#168A8A] hover:underline"
          >
            Brgy. {place.barangay.name}
          </Link>
        )}
      </div>

      {/* Hero Header Card */}
      <section className="bg-white rounded-3xl border border-[#E5E0D5] overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-6 relative aspect-[16/10] lg:aspect-auto min-h-[260px]">
            <img
              src={imageSrc}
              alt={place.name}
              className="w-full h-full object-cover"
            />
            {place.featuredImageCaption && (
              <p className="absolute bottom-2 left-2 right-2 rounded-lg bg-black/55 backdrop-blur-xs text-[11px] text-white px-3 py-1">
                {place.featuredImageCaption}
              </p>
            )}
          </div>

          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[#123F35] text-white px-3 py-1 text-xs font-bold capitalize">
                  {place.primaryCategory?.name || place.placeType}
                </span>
                {place.isHiddenGem && (
                  <span className="inline-flex items-center rounded-full bg-[#D6A85B] text-[#0D3029] px-3 py-1 text-xs font-bold">
                    Hidden Gem
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 px-2.5 py-0.5 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Verified Record
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-4xl font-bold text-[#202B28] leading-tight">
                {place.name}
              </h1>

              <p className="inline-flex items-start gap-1.5 text-sm font-medium text-[#168A8A]">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{place.address}</span>
              </p>

              <p className="text-sm sm:text-base text-[#5A6B66] leading-relaxed">
                {place.description}
              </p>
            </div>

            <PlaceDetailActions
              place={{
                id: place.id,
                name: place.name,
                slug: place.slug,
                placeType: place.placeType,
                barangayName: place.barangay?.name ?? null,
                featuredImageUrl: place.featuredImageUrl ?? null,
                latitude: place.latitude ?? null,
                longitude: place.longitude ?? null,
              }}
            />
          </div>
        </div>
      </section>

      {/* Specialized Template Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Specialized Café Details */}
          {place.cafeDetails && (
            <section className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-900/10 text-amber-900 flex items-center justify-center">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-[#202B28]">
                    Café Menu &amp; Atmosphere
                  </h2>
                  <p className="text-xs text-[#5A6B66]">
                    Verified coffee &amp; refreshment offerings
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {place.cafeDetails.hasWifi !== null && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] px-3 py-1.5 text-xs font-semibold">
                    <Wifi className="w-3.5 h-3.5 text-[#168A8A]" />
                    {place.cafeDetails.hasWifi ? "Wi-Fi Available" : "No Public Wi-Fi"}
                  </span>
                )}
                {place.cafeDetails.hasParking !== null && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] px-3 py-1.5 text-xs font-semibold">
                    <Car className="w-3.5 h-3.5 text-[#168A8A]" />
                    {place.cafeDetails.hasParking ? "Parking Available" : "Street / Limited Parking"}
                  </span>
                )}
                {place.cafeDetails.priceRangeNote && (
                  <span className="inline-flex items-center rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] px-3 py-1.5 text-xs font-semibold">
                    Price Note: {place.cafeDetails.priceRangeNote}
                  </span>
                )}
              </div>

              {place.cafeDetails.featuredDrinks && place.cafeDetails.featuredDrinks.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A6B66] mb-2">
                    Featured Drinks
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {place.cafeDetails.featuredDrinks.map((d) => (
                      <span
                        key={d}
                        className="rounded-xl bg-[#123F35]/8 text-[#123F35] px-3 py-1.5 text-xs font-semibold"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {place.cafeDetails.foodOfferings && place.cafeDetails.foodOfferings.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A6B66] mb-2">
                    Food &amp; Pastries
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {place.cafeDetails.foodOfferings.map((f) => (
                      <span
                        key={f}
                        className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] px-3 py-1.5 text-xs font-medium"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {place.cafeDetails.brewStyleNote && (
                <p className="text-sm text-[#5A6B66]">{place.cafeDetails.brewStyleNote}</p>
              )}
            </section>
          )}

          {/* Specialized Resort Details */}
          {place.resortDetails && (
            <section className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#168A8A]/12 text-[#168A8A] flex items-center justify-center">
                  <Waves className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-[#202B28]">
                    Resort Facilities, Cottages &amp; Rates
                  </h2>
                  <p className="text-xs text-[#5A6B66]">
                    Spring pools, cottages, rooms, and verified guest notes
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {place.resortDetails.poolsSummary && (
                  <div className="rounded-2xl bg-[#F8F7F2] border border-[#E5E0D5] p-4 space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#168A8A]">
                      Pools &amp; Water Features
                    </h3>
                    <p className="text-sm text-[#202B28] leading-relaxed">
                      {place.resortDetails.poolsSummary}
                    </p>
                  </div>
                )}
                {place.resortDetails.cottagesSummary && (
                  <div className="rounded-2xl bg-[#F8F7F2] border border-[#E5E0D5] p-4 space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#168A8A]">
                      Cottages &amp; Cabanas
                    </h3>
                    <p className="text-sm text-[#202B28] leading-relaxed">
                      {place.resortDetails.cottagesSummary}
                    </p>
                  </div>
                )}
                {place.resortDetails.roomsSummary && (
                  <div className="rounded-2xl bg-[#F8F7F2] border border-[#E5E0D5] p-4 space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#168A8A]">
                      Rooms &amp; Stays
                    </h3>
                    <p className="text-sm text-[#202B28] leading-relaxed">
                      {place.resortDetails.roomsSummary}
                    </p>
                  </div>
                )}
                {(place.resortDetails.entranceFeeNote || place.resortDetails.cottageRoomRatesNote) && (
                  <div className="rounded-2xl bg-[#D6A85B]/12 border border-[#D6A85B]/40 p-4 space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C611B]">
                      Rates &amp; Inquiries
                    </h3>
                    {place.resortDetails.entranceFeeNote && (
                      <p className="text-sm text-[#202B28]">
                        <strong>Entrance:</strong> {place.resortDetails.entranceFeeNote}
                      </p>
                    )}
                    {place.resortDetails.cottageRoomRatesNote && (
                      <p className="text-sm text-[#202B28]">
                        <strong>Cottages/Rooms:</strong>{" "}
                        {place.resortDetails.cottageRoomRatesNote}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {place.resortDetails.recreationalFacilities &&
                place.resortDetails.recreationalFacilities.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A6B66] mb-2">
                      Recreational Facilities
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {place.resortDetails.recreationalFacilities.map((fac) => (
                        <span
                          key={fac}
                          className="rounded-xl bg-[#123F35]/8 text-[#123F35] px-3 py-1.5 text-xs font-semibold"
                        >
                          {fac}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {place.resortDetails.policies && place.resortDetails.policies.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A6B66] mb-2">
                    Guest Policies &amp; Tips
                  </h3>
                  <ul className="space-y-1.5 text-sm text-[#5A6B66]">
                    {place.resortDetails.policies.map((pol) => (
                      <li key={pol} className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-[#168A8A] shrink-0 mt-0.5" />
                        <span>{pol}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {place.resortDetails.externalInquiryUrl && (
                <div>
                  <a
                    href={place.resortDetails.externalInquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#168A8A] text-white px-4 py-2.5 text-xs font-bold hover:opacity-90 transition"
                  >
                    Official Resort Inquiry Page
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </section>
          )}

          {/* Specialized Restaurant / Eatery Details */}
          {place.restaurantDetails && (
            <section className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-600/12 text-amber-800 flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-[#202B28]">
                    Dining Highlights &amp; Specialties
                  </h2>
                  <p className="text-xs text-[#5A6B66]">
                    {place.restaurantDetails.cuisineType || "Local Ilocano Dining"}
                  </p>
                </div>
              </div>

              {place.restaurantDetails.featuredDishes &&
                place.restaurantDetails.featuredDishes.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A6B66] mb-2">
                      Featured Dishes
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {place.restaurantDetails.featuredDishes.map((dish) => (
                        <span
                          key={dish}
                          className="rounded-xl bg-[#D6A85B]/20 text-[#202B28] px-3 py-1.5 text-xs font-bold"
                        >
                          {dish}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {place.restaurantDetails.menuHighlights &&
                place.restaurantDetails.menuHighlights.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A6B66] mb-2">
                      Menu Highlights
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {place.restaurantDetails.menuHighlights.map((item) => (
                        <span
                          key={item}
                          className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] px-3 py-1.5 text-xs font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {place.restaurantDetails.diningOptions &&
                place.restaurantDetails.diningOptions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {place.restaurantDetails.diningOptions.map((opt) => (
                      <span
                        key={opt}
                        className="rounded-full bg-[#123F35]/10 text-[#123F35] px-3 py-1 text-xs font-semibold"
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                )}
            </section>
          )}

          {/* Specialized Attraction / Nature / Heritage Details */}
          {place.attractionDetails && (
            <section className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#123F35]/10 text-[#123F35] flex items-center justify-center">
                  <Trees className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-[#202B28]">
                    Visitor Guide &amp; Activities
                  </h2>
                  <p className="text-xs text-[#5A6B66]">
                    Activities, guidelines &amp; historical context
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {place.attractionDetails.difficultyLevel && (
                  <span className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] px-3 py-1.5 text-xs font-semibold">
                    Trail / Access: {place.attractionDetails.difficultyLevel}
                  </span>
                )}
                {place.attractionDetails.estimatedDurationMinutes && (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] px-3 py-1.5 text-xs font-semibold tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-[#168A8A]" />
                    Suggested visit: ~{place.attractionDetails.estimatedDurationMinutes} mins
                  </span>
                )}
                {place.attractionDetails.entranceInfo && (
                  <span className="rounded-xl bg-[#D6A85B]/15 border border-[#D6A85B]/40 px-3 py-1.5 text-xs font-semibold text-[#202B28]">
                    {place.attractionDetails.entranceInfo}
                  </span>
                )}
              </div>

              {place.attractionDetails.activities &&
                place.attractionDetails.activities.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A6B66] mb-2">
                      Recommended Activities
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {place.attractionDetails.activities.map((act) => (
                        <span
                          key={act}
                          className="rounded-xl bg-[#123F35]/8 text-[#123F35] px-3 py-1.5 text-xs font-semibold"
                        >
                          {act}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {place.attractionDetails.historicalDetails && (
                <div className="rounded-2xl bg-[#F8F7F2] border border-[#E5E0D5] p-4 space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#168A8A]">
                    Heritage &amp; Background
                  </h3>
                  <p className="text-sm text-[#202B28] leading-relaxed">
                    {place.attractionDetails.historicalDetails}
                  </p>
                </div>
              )}

              {place.attractionDetails.visitorGuidelines &&
                place.attractionDetails.visitorGuidelines.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A6B66] mb-2">
                      Visitor &amp; Eco-Tourism Guidelines
                    </h3>
                    <ul className="space-y-1.5 text-sm text-[#5A6B66]">
                      {place.attractionDetails.visitorGuidelines.map((g) => (
                        <li key={g} className="flex items-start gap-2">
                          <ShieldAlert className="w-4 h-4 text-[#D6A85B] shrink-0 mt-0.5" />
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </section>
          )}

          {/* Amenities */}
          {place.amenities.length > 0 && (
            <section className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-3">
              <h2 className="font-display text-lg font-bold text-[#202B28]">
                On-Site Amenities
              </h2>
              <div className="flex flex-wrap gap-2">
                {place.amenities.map((a) => (
                  <span
                    key={a.id}
                    className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] px-3 py-1.5 text-xs font-semibold text-[#202B28]"
                  >
                    {a.name}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Contact, Hours, Verification & Barangay Context */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#202B28]">
              Practical Information
            </h2>

            {place.phone && (
              <div className="flex items-start gap-2.5 text-sm">
                <Phone className="w-4 h-4 text-[#168A8A] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-[#5A6B66]">Verified Contact</p>
                  <a
                    href={`tel:${place.phone.replace(/[^+\d]/g, "")}`}
                    className="font-semibold text-[#123F35] hover:underline"
                  >
                    {place.phone}
                  </a>
                </div>
              </div>
            )}

            {(place.websiteUrl || place.socialMediaUrl) && (
              <div className="flex items-start gap-2.5 text-sm">
                <Globe className="w-4 h-4 text-[#168A8A] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs text-[#5A6B66]">Official Link</p>
                  <a
                    href={place.websiteUrl || place.socialMediaUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-[#168A8A] hover:underline break-all"
                  >
                    Visit Official Page
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              </div>
            )}

            {place.operatingHours.length > 0 && (
              <div className="pt-2 border-t border-[#E5E0D5] space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[#5A6B66]">
                  Verified Schedule
                </p>
                <div className="space-y-1 text-xs">
                  {place.operatingHours.map((h) => (
                    <div key={h.id} className="flex justify-between gap-2">
                      <span className="font-medium text-[#202B28]">
                        {DAY_NAMES[h.dayOfWeek]}
                      </span>
                      <span className="text-[#5A6B66] tabular-nums">
                        {h.isClosed ? "Closed" : `${h.openTime} – ${h.closeTime}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#E5E0D5] text-[11px] text-[#5A6B66] space-y-1">
              <p>
                <strong>Source Reference:</strong> {place.sourceReference}
              </p>
              {place.verificationDate && (
                <p>
                  <strong>Verified Date:</strong> {place.verificationDate}
                </p>
              )}
              {place.latitude && place.longitude && (
                <p className="tabular-nums">
                  <strong>GPS:</strong> {place.latitude.toFixed(4)}° N,{" "}
                  {place.longitude.toFixed(4)}° E
                </p>
              )}
            </div>
          </div>

          {place.barangay && (
            <div className="bg-[#123F35] text-white rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-[#D6A85B]">
                <Compass className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Barangay Context
                </span>
              </div>
              <h3 className="font-display text-xl font-bold">
                Brgy. {place.barangay.name}
              </h3>
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                {place.barangay.summary}
              </p>
              <Link
                href={`/app/discover?barangay=${encodeURIComponent(place.barangay.slug)}`}
                className="inline-block text-xs font-bold text-[#D6A85B] hover:underline"
              >
                Explore more in Brgy. {place.barangay.name} →
              </Link>
            </div>
          )}
        </aside>
      </div>

      {/* Nearby / Related Published Spots */}
      {place.relatedPlaces.length > 0 && (
        <section className="space-y-4 pt-4">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#202B28]">
            Continue Exploring Salcedo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {place.relatedPlaces.map((rel) => (
              <PlaceCard key={rel.id} place={rel} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
