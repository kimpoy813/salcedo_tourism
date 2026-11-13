import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Flame,
  Globe,
  MapPin,
  Phone,
  ShieldAlert,
  Star,
} from "lucide-react";
import { getPublishedPlaceByIdOrSlug } from "@/lib/queries/public-tourism";
import {
  PlaceDetailActions,
  PlaceHeroOverlayControls,
  PlaceRatingsSection,
} from "@/components/app/PlaceDetailClient";
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
  const todayIndex = new Date().getDay();
  const actionPayload = {
    id: place.id,
    name: place.name,
    slug: place.slug,
    placeType: place.placeType,
    barangayName: place.barangay?.name ?? null,
    featuredImageUrl: place.featuredImageUrl ?? null,
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
  };

  return (
    <div className="min-h-full bg-[#FAF9F6]">
      {/* Full-Bleed Native Hero Photo + Floating Frosted Back/Share/Bookmark Controls */}
      <section className="relative h-[290px] bg-[#164237] overflow-hidden">
        <img
          src={imageSrc}
          alt={place.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/25 pointer-events-none" />
        <PlaceHeroOverlayControls place={actionPayload} />
      </section>

      {/* Overlapping Native Sheet Container */}
      <div className="relative z-10 -mt-6 rounded-t-[28px] bg-[#FAF9F6] pt-3 pb-0 space-y-6">
        <div className="px-4 space-y-6">
        <div className="w-10 h-1 rounded-full bg-[#D8D3C8] mx-auto" />

        {/* Title & Overview */}
        <section className="space-y-3 border-b border-[#EAE7E0] pb-5">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#616E69]">
            <span>{place.primaryCategory?.name || place.placeType}</span>
            {place.isHiddenGem && (
              <>
                <span>•</span>
                <span className="text-[#B88A44]">Hidden Gem</span>
              </>
            )}
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-[#164237]">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
          </div>

          <h1 className="font-display text-2xl font-bold text-[#1A2421] leading-snug">
            {place.name}
          </h1>

          {/* Live Municipal Rank, Rating & Visit Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {place.ratingCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white border border-[#EAE7E0] px-2.5 py-1 text-[11px] font-bold text-[#1A2421] tabular-nums">
                <Star className="w-3 h-3 text-[#B88A44]" fill="currentColor" />
                {place.averageRating.toFixed(1)}
                <span className="font-normal text-[#616E69]">({place.ratingCount})</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-[#164237]/10 px-2.5 py-1 text-[11px] font-bold text-[#164237] tabular-nums">
              <Flame className="w-3 h-3" />#{place.mostVisitedRank} Most Visited
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F2EE] px-2.5 py-1 text-[11px] font-semibold text-[#1A2421] tabular-nums">
              #{place.categoryRank} in {place.primaryCategory?.name || place.placeType}
            </span>
            {place.visitCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F2EE] px-2.5 py-1 text-[11px] text-[#616E69] tabular-nums">
                <Eye className="w-3 h-3" />
                {place.visitCount} visits
              </span>
            )}
          </div>

          <p className="inline-flex items-center gap-1.5 text-xs text-[#616E69]">
            <MapPin className="w-3.5 h-3.5 text-[#1D7874] shrink-0" />
            <span>{place.address}</span>
          </p>

          <p className="text-sm text-[#1A2421]/90 leading-relaxed">{place.description}</p>
        </section>

        {/* Specialized Café Details */}
        {place.cafeDetails && (
          <section className="space-y-3 border-b border-[#EAE7E0] pb-5">
            <h2 className="font-display text-base font-bold text-[#1A2421]">
              Café Highlights
            </h2>

            <div className="flex flex-wrap gap-1.5">
              {place.cafeDetails.hasWifi !== null && (
                <span className="rounded-full bg-[#F3F2EE] px-3 py-1 text-xs font-medium text-[#1A2421]">
                  {place.cafeDetails.hasWifi ? "Wi-Fi Available" : "No Public Wi-Fi"}
                </span>
              )}
              {place.cafeDetails.hasParking !== null && (
                <span className="rounded-full bg-[#F3F2EE] px-3 py-1 text-xs font-medium text-[#1A2421]">
                  {place.cafeDetails.hasParking ? "Parking" : "Limited Parking"}
                </span>
              )}
              {place.cafeDetails.priceRangeNote && (
                <span className="rounded-full bg-[#F3F2EE] px-3 py-1 text-xs font-medium text-[#1A2421]">
                  {place.cafeDetails.priceRangeNote}
                </span>
              )}
            </div>

            {place.cafeDetails.featuredDrinks && place.cafeDetails.featuredDrinks.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#616E69]">
                  Drinks
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {place.cafeDetails.featuredDrinks.map((d) => (
                    <span
                      key={d}
                      className="rounded-full bg-white border border-[#EAE7E0] px-3 py-1 text-xs text-[#1A2421]"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {place.cafeDetails.foodOfferings && place.cafeDetails.foodOfferings.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#616E69]">
                  Food
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {place.cafeDetails.foodOfferings.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-white border border-[#EAE7E0] px-3 py-1 text-xs text-[#1A2421]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Specialized Accommodation Details */}
        {place.accommodationDetails && (
          <section className="space-y-3 border-b border-[#EAE7E0] pb-5">
            <h2 className="font-display text-base font-bold text-[#1A2421]">
              Stay Details
            </h2>
            {place.accommodationDetails.accommodationType && (
              <p className="text-xs font-semibold text-[#164237]">
                {place.accommodationDetails.accommodationType}
              </p>
            )}
            {place.accommodationDetails.roomTypesSummary && (
              <p className="text-xs text-[#1A2421] leading-relaxed">
                {place.accommodationDetails.roomTypesSummary}
              </p>
            )}
            {place.accommodationDetails.rateNote && (
              <div className="rounded-xl bg-[#F3F2EE] p-3 text-xs text-[#1A2421]">
                <strong>Rates:</strong> {place.accommodationDetails.rateNote}
              </div>
            )}
            {place.accommodationDetails.checkInOutPolicy && (
              <p className="text-xs text-[#616E69]">
                {place.accommodationDetails.checkInOutPolicy}
              </p>
            )}
          </section>
        )}

        {/* Specialized Resort Details */}
        {place.resortDetails && (
          <section className="space-y-3 border-b border-[#EAE7E0] pb-5">
            <h2 className="font-display text-base font-bold text-[#1A2421]">
              Resort Facilities &amp; Rates
            </h2>

            <div className="space-y-2.5 text-xs text-[#1A2421]">
              {place.resortDetails.poolsSummary && (
                <div>
                  <p className="font-semibold text-[#616E69]">Pools &amp; Water</p>
                  <p className="leading-relaxed">{place.resortDetails.poolsSummary}</p>
                </div>
              )}
              {place.resortDetails.cottagesSummary && (
                <div>
                  <p className="font-semibold text-[#616E69]">Cottages</p>
                  <p className="leading-relaxed">{place.resortDetails.cottagesSummary}</p>
                </div>
              )}
              {place.resortDetails.roomsSummary && (
                <div>
                  <p className="font-semibold text-[#616E69]">Rooms</p>
                  <p className="leading-relaxed">{place.resortDetails.roomsSummary}</p>
                </div>
              )}
              {(place.resortDetails.entranceFeeNote ||
                place.resortDetails.cottageRoomRatesNote) && (
                <div className="rounded-xl bg-[#F3F2EE] p-3 space-y-1">
                  {place.resortDetails.entranceFeeNote && (
                    <p>
                      <strong>Entrance:</strong> {place.resortDetails.entranceFeeNote}
                    </p>
                  )}
                  {place.resortDetails.cottageRoomRatesNote && (
                    <p>
                      <strong>Rates:</strong> {place.resortDetails.cottageRoomRatesNote}
                    </p>
                  )}
                </div>
              )}
            </div>

            {place.resortDetails.recreationalFacilities &&
              place.resortDetails.recreationalFacilities.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {place.resortDetails.recreationalFacilities.map((fac) => (
                    <span
                      key={fac}
                      className="rounded-full bg-white border border-[#EAE7E0] px-3 py-1 text-[11px] font-medium text-[#1A2421]"
                    >
                      {fac}
                    </span>
                  ))}
                </div>
              )}

            {place.resortDetails.policies && place.resortDetails.policies.length > 0 && (
              <ul className="space-y-1 text-xs text-[#616E69] list-disc pl-4">
                {place.resortDetails.policies.map((pol) => (
                  <li key={pol}>{pol}</li>
                ))}
              </ul>
            )}

            {place.resortDetails.externalInquiryUrl && (
              <a
                href={place.resortDetails.externalInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#164237] hover:underline"
              >
                Official Inquiry Page <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </section>
        )}

        {/* Specialized Restaurant / Eatery Details */}
        {place.restaurantDetails && (
          <section className="space-y-3 border-b border-[#EAE7E0] pb-5">
            <h2 className="font-display text-base font-bold text-[#1A2421]">
              Dining &amp; Specialties
            </h2>
            {place.restaurantDetails.cuisineType && (
              <p className="text-xs text-[#616E69]">{place.restaurantDetails.cuisineType}</p>
            )}
            {place.restaurantDetails.featuredDishes &&
              place.restaurantDetails.featuredDishes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {place.restaurantDetails.featuredDishes.map((dish) => (
                    <span
                      key={dish}
                      className="rounded-full bg-[#F3F2EE] px-3 py-1 text-xs font-semibold text-[#1A2421]"
                    >
                      {dish}
                    </span>
                  ))}
                </div>
              )}
            {place.restaurantDetails.priceRangeNote && (
              <p className="text-xs text-[#616E69]">{place.restaurantDetails.priceRangeNote}</p>
            )}
          </section>
        )}

        {/* Specialized Attraction / Nature / Heritage Details */}
        {place.attractionDetails && (
          <section className="space-y-3 border-b border-[#EAE7E0] pb-5">
            <h2 className="font-display text-base font-bold text-[#1A2421]">
              Visitor Guide
            </h2>

            <div className="flex flex-wrap gap-1.5">
              {place.attractionDetails.difficultyLevel && (
                <span className="rounded-full bg-[#F3F2EE] px-3 py-1 text-[11px] font-medium text-[#1A2421]">
                  Access: {place.attractionDetails.difficultyLevel}
                </span>
              )}
              {place.attractionDetails.estimatedDurationMinutes && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F2EE] px-3 py-1 text-[11px] font-medium text-[#1A2421] tabular-nums">
                  <Clock className="w-3 h-3 text-[#616E69]" />~
                  {place.attractionDetails.estimatedDurationMinutes} mins
                </span>
              )}
              {place.attractionDetails.entranceInfo && (
                <span className="rounded-full bg-[#F3F2EE] px-3 py-1 text-[11px] font-medium text-[#1A2421]">
                  {place.attractionDetails.entranceInfo}
                </span>
              )}
            </div>

            {place.attractionDetails.activities &&
              place.attractionDetails.activities.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {place.attractionDetails.activities.map((act) => (
                    <span
                      key={act}
                      className="rounded-full bg-white border border-[#EAE7E0] px-3 py-1 text-[11px] font-medium text-[#1A2421]"
                    >
                      {act}
                    </span>
                  ))}
                </div>
              )}

            {place.attractionDetails.historicalDetails && (
              <p className="text-xs text-[#616E69] leading-relaxed">
                {place.attractionDetails.historicalDetails}
              </p>
            )}

            {place.attractionDetails.visitorGuidelines &&
              place.attractionDetails.visitorGuidelines.length > 0 && (
                <ul className="space-y-1 text-xs text-[#616E69]">
                  {place.attractionDetails.visitorGuidelines.map((g) => (
                    <li key={g} className="flex items-start gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#B88A44] shrink-0 mt-0.5" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              )}
          </section>
        )}

        {/* Amenities */}
        {place.amenities.length > 0 && (
          <section className="space-y-2.5 border-b border-[#EAE7E0] pb-5">
            <h2 className="font-display text-sm font-bold text-[#1A2421]">Amenities</h2>
            <div className="flex flex-wrap gap-1.5">
              {place.amenities.map((a) => (
                <span
                  key={a.id}
                  className="rounded-full bg-white border border-[#EAE7E0] px-3 py-1 text-[11px] text-[#1A2421]"
                >
                  {a.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Practical Information */}
        <section className="space-y-3 border-b border-[#EAE7E0] pb-5">
          <h2 className="font-display text-sm font-bold text-[#1A2421]">
            Practical Info
          </h2>

          {place.phone && (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 text-[#616E69]">
                <Phone className="w-3.5 h-3.5" /> Contact
              </span>
              <a
                href={`tel:${place.phone.replace(/[^+\d]/g, "")}`}
                className="font-semibold text-[#164237] hover:underline tabular-nums"
              >
                {place.phone}
              </a>
            </div>
          )}

          {(place.websiteUrl || place.socialMediaUrl) && (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 text-[#616E69]">
                <Globe className="w-3.5 h-3.5" /> Official Link
              </span>
              <a
                href={place.websiteUrl || place.socialMediaUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[#164237] hover:underline"
              >
                Open <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {place.operatingHours.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#616E69]">
                Schedule
              </p>
              <div className="space-y-1 text-xs">
                {place.operatingHours.map((h) => {
                  const isToday = h.dayOfWeek === todayIndex;
                  return (
                    <div
                      key={h.id}
                      className={`flex justify-between gap-2 py-0.5 ${
                        isToday ? "font-bold text-[#164237]" : "text-[#616E69]"
                      }`}
                    >
                      <span>
                        {DAY_NAMES[h.dayOfWeek]} {isToday ? "• Today" : ""}
                      </span>
                      <span className="tabular-nums">
                        {h.isClosed ? "Closed" : `${h.openTime} – ${h.closeTime}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-1 text-[11px] text-[#616E69] space-y-0.5">
            <p>Source: {place.sourceReference}</p>
            {place.latitude && place.longitude && (
              <p className="tabular-nums">
                GPS: {place.latitude.toFixed(4)}° N, {place.longitude.toFixed(4)}° E
              </p>
            )}
          </div>
        </section>

        {/* Tourist Ratings & Account-Free Reviews */}
        <PlaceRatingsSection
          placeId={place.id}
          placeName={place.name}
          initialSummary={place.ratingsSummary}
        />

        {/* Barangay Context */}
        {place.barangay && (
          <Link
            href={`/app/discover?barangay=${encodeURIComponent(place.barangay.slug)}`}
            className="block rounded-2xl bg-white border border-[#EAE7E0] p-4 space-y-1 active:bg-[#F3F2EE] transition"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#616E69]">
              Barangay Context
            </p>
            <p className="font-display text-sm font-bold text-[#1A2421]">
              Brgy. {place.barangay.name}
            </p>
            <p className="text-xs text-[#616E69] line-clamp-2">{place.barangay.summary}</p>
            <span className="inline-block text-[11px] font-semibold text-[#164237] pt-0.5">
              See more in Brgy. {place.barangay.name} →
            </span>
          </Link>
        )}
        </div>

        {/* Continue Exploring */}
        {place.relatedPlaces.length > 0 && (
          <section className="space-y-3 pt-1">
            <h2 className="px-4 font-display text-base font-bold text-[#1A2421]">
              More in Salcedo
            </h2>
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar px-4 scroll-px-4 pb-1 after:content-[''] after:w-1 after:shrink-0">
              {place.relatedPlaces.map((rel) => (
                <PlaceCard key={rel.id} place={rel} variant="rail" />
              ))}
            </div>
          </section>
        )}

        {/* Native Sticky Action Dock */}
        <PlaceDetailActions place={actionPayload} />
      </div>
    </div>
  );
}
