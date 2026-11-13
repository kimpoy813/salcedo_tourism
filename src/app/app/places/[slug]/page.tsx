import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Clock,
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
  Coffee,
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
  const todayIndex = new Date().getDay();

  return (
    <div className="pb-20 space-y-5">
      {/* Edge-to-Edge Mobile Hero Photo */}
      <section className="relative aspect-[4/3] bg-[#0D3029] overflow-hidden">
        <img
          src={imageSrc}
          alt={place.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 space-y-1.5 text-white">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-[#123F35]/95 border border-white/20 px-2.5 py-0.5 text-[10px] font-bold capitalize">
              {place.primaryCategory?.name || place.placeType}
            </span>
            {place.isHiddenGem && (
              <span className="inline-flex items-center rounded-full bg-[#D6A85B] text-[#0D3029] px-2.5 py-0.5 text-[10px] font-bold">
                Hidden Gem
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 border border-emerald-300/30 text-emerald-100 px-2 py-0.5 text-[10px] font-semibold">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
          </div>

          <h1 className="font-display text-2xl font-bold leading-tight">
            {place.name}
          </h1>
          <p className="inline-flex items-center gap-1 text-xs text-white/90">
            <MapPin className="w-3.5 h-3.5 text-[#D6A85B] shrink-0" />
            <span>{place.address}</span>
          </p>
        </div>
      </section>

      <div className="px-4 space-y-5">
        {/* Description & Quick Actions */}
        <section className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-3.5">
          {place.featuredImageCaption && (
            <p className="text-[11px] text-[#5A6B66] italic border-b border-[#E5E0D5] pb-2">
              {place.featuredImageCaption}
            </p>
          )}

          <p className="text-sm text-[#202B28] leading-relaxed">{place.description}</p>

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
        </section>

        {/* Specialized Café Details */}
        {place.cafeDetails && (
          <section className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-900/10 text-amber-900 flex items-center justify-center shrink-0">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-[#202B28]">
                  Café Menu &amp; Atmosphere
                </h2>
                <p className="text-[11px] text-[#5A6B66]">Coffee &amp; refreshment offerings</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {place.cafeDetails.hasWifi !== null && (
                <span className="inline-flex items-center gap-1 rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] px-2.5 py-1 text-[11px] font-semibold">
                  <Wifi className="w-3 h-3 text-[#168A8A]" />
                  {place.cafeDetails.hasWifi ? "Wi-Fi Available" : "No Public Wi-Fi"}
                </span>
              )}
              {place.cafeDetails.hasParking !== null && (
                <span className="inline-flex items-center gap-1 rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] px-2.5 py-1 text-[11px] font-semibold">
                  <Car className="w-3 h-3 text-[#168A8A]" />
                  {place.cafeDetails.hasParking ? "Parking" : "Limited Parking"}
                </span>
              )}
              {place.cafeDetails.priceRangeNote && (
                <span className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] px-2.5 py-1 text-[11px] font-semibold">
                  {place.cafeDetails.priceRangeNote}
                </span>
              )}
            </div>

            {place.cafeDetails.featuredDrinks && place.cafeDetails.featuredDrinks.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#5A6B66] mb-1.5">
                  Featured Drinks
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {place.cafeDetails.featuredDrinks.map((d) => (
                    <span
                      key={d}
                      className="rounded-lg bg-[#123F35]/8 text-[#123F35] px-2.5 py-1 text-xs font-semibold"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {place.cafeDetails.foodOfferings && place.cafeDetails.foodOfferings.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#5A6B66] mb-1.5">
                  Food &amp; Pastries
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {place.cafeDetails.foodOfferings.map((f) => (
                    <span
                      key={f}
                      className="rounded-lg bg-[#F8F7F2] border border-[#E5E0D5] px-2.5 py-1 text-xs"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Specialized Resort Details */}
        {place.resortDetails && (
          <section className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#168A8A]/12 text-[#168A8A] flex items-center justify-center shrink-0">
                <Waves className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-[#202B28]">
                  Resort Facilities &amp; Rates
                </h2>
                <p className="text-[11px] text-[#5A6B66]">
                  Spring pools, cottages, rooms &amp; policies
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {place.resortDetails.poolsSummary && (
                <div className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] p-3 space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#168A8A]">
                    Pools &amp; Water Features
                  </p>
                  <p className="text-xs text-[#202B28] leading-relaxed">
                    {place.resortDetails.poolsSummary}
                  </p>
                </div>
              )}
              {place.resortDetails.cottagesSummary && (
                <div className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] p-3 space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#168A8A]">
                    Cottages &amp; Cabanas
                  </p>
                  <p className="text-xs text-[#202B28] leading-relaxed">
                    {place.resortDetails.cottagesSummary}
                  </p>
                </div>
              )}
              {place.resortDetails.roomsSummary && (
                <div className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] p-3 space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#168A8A]">
                    Rooms &amp; Stays
                  </p>
                  <p className="text-xs text-[#202B28] leading-relaxed">
                    {place.resortDetails.roomsSummary}
                  </p>
                </div>
              )}
              {(place.resortDetails.entranceFeeNote ||
                place.resortDetails.cottageRoomRatesNote) && (
                <div className="rounded-xl bg-[#D6A85B]/15 border border-[#D6A85B]/40 p-3 space-y-1 text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C611B]">
                    Rates &amp; Inquiries
                  </p>
                  {place.resortDetails.entranceFeeNote && (
                    <p>
                      <strong>Entrance:</strong> {place.resortDetails.entranceFeeNote}
                    </p>
                  )}
                  {place.resortDetails.cottageRoomRatesNote && (
                    <p>
                      <strong>Cottages/Rooms:</strong>{" "}
                      {place.resortDetails.cottageRoomRatesNote}
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
                      className="rounded-lg bg-[#123F35]/8 text-[#123F35] px-2.5 py-1 text-[11px] font-semibold"
                    >
                      {fac}
                    </span>
                  ))}
                </div>
              )}

            {place.resortDetails.policies && place.resortDetails.policies.length > 0 && (
              <ul className="space-y-1.5 text-xs text-[#5A6B66]">
                {place.resortDetails.policies.map((pol) => (
                  <li key={pol} className="flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-[#168A8A] shrink-0 mt-0.5" />
                    <span>{pol}</span>
                  </li>
                ))}
              </ul>
            )}

            {place.resortDetails.externalInquiryUrl && (
              <a
                href={place.resortDetails.externalInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#168A8A] text-white px-3.5 py-2 text-xs font-bold"
              >
                Official Inquiry Page <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </section>
        )}

        {/* Specialized Restaurant / Eatery Details */}
        {place.restaurantDetails && (
          <section className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-600/12 text-amber-800 flex items-center justify-center shrink-0">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-[#202B28]">
                  Dining &amp; Specialties
                </h2>
                <p className="text-[11px] text-[#5A6B66]">
                  {place.restaurantDetails.cuisineType || "Local Ilocano Dining"}
                </p>
              </div>
            </div>

            {place.restaurantDetails.featuredDishes &&
              place.restaurantDetails.featuredDishes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {place.restaurantDetails.featuredDishes.map((dish) => (
                    <span
                      key={dish}
                      className="rounded-lg bg-[#D6A85B]/20 text-[#202B28] px-2.5 py-1 text-xs font-bold"
                    >
                      {dish}
                    </span>
                  ))}
                </div>
              )}

            {place.restaurantDetails.menuHighlights &&
              place.restaurantDetails.menuHighlights.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {place.restaurantDetails.menuHighlights.map((item) => (
                    <span
                      key={item}
                      className="rounded-lg bg-[#F8F7F2] border border-[#E5E0D5] px-2.5 py-1 text-xs"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
          </section>
        )}

        {/* Specialized Attraction / Nature / Heritage Details */}
        {place.attractionDetails && (
          <section className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#123F35]/10 text-[#123F35] flex items-center justify-center shrink-0">
                <Trees className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-[#202B28]">
                  Visitor Guide &amp; Activities
                </h2>
                <p className="text-[11px] text-[#5A6B66]">
                  Activities, guidelines &amp; heritage notes
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {place.attractionDetails.difficultyLevel && (
                <span className="rounded-lg bg-[#F8F7F2] border border-[#E5E0D5] px-2.5 py-1 text-[11px] font-semibold">
                  Access: {place.attractionDetails.difficultyLevel}
                </span>
              )}
              {place.attractionDetails.estimatedDurationMinutes && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#F8F7F2] border border-[#E5E0D5] px-2.5 py-1 text-[11px] font-semibold tabular-nums">
                  <Clock className="w-3 h-3 text-[#168A8A]" />~
                  {place.attractionDetails.estimatedDurationMinutes} mins
                </span>
              )}
              {place.attractionDetails.entranceInfo && (
                <span className="rounded-lg bg-[#D6A85B]/15 border border-[#D6A85B]/40 px-2.5 py-1 text-[11px] font-semibold text-[#202B28]">
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
                      className="rounded-lg bg-[#123F35]/8 text-[#123F35] px-2.5 py-1 text-[11px] font-semibold"
                    >
                      {act}
                    </span>
                  ))}
                </div>
              )}

            {place.attractionDetails.historicalDetails && (
              <div className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] p-3 space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#168A8A]">
                  Heritage &amp; Background
                </p>
                <p className="text-xs text-[#202B28] leading-relaxed">
                  {place.attractionDetails.historicalDetails}
                </p>
              </div>
            )}

            {place.attractionDetails.visitorGuidelines &&
              place.attractionDetails.visitorGuidelines.length > 0 && (
                <ul className="space-y-1.5 text-xs text-[#5A6B66]">
                  {place.attractionDetails.visitorGuidelines.map((g) => (
                    <li key={g} className="flex items-start gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#D6A85B] shrink-0 mt-0.5" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              )}
          </section>
        )}

        {/* Amenities */}
        {place.amenities.length > 0 && (
          <section className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-2.5">
            <h2 className="font-display text-sm font-bold text-[#202B28]">On-Site Amenities</h2>
            <div className="flex flex-wrap gap-1.5">
              {place.amenities.map((a) => (
                <span
                  key={a.id}
                  className="rounded-lg bg-[#F8F7F2] border border-[#E5E0D5] px-2.5 py-1 text-[11px] font-semibold text-[#202B28]"
                >
                  {a.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Practical Information Card */}
        <section className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-3">
          <h2 className="font-display text-sm font-bold text-[#202B28]">
            Practical Information
          </h2>

          {place.phone && (
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[#5A6B66]">
                <Phone className="w-3.5 h-3.5 text-[#168A8A]" />
                <span>Contact</span>
              </div>
              <a
                href={`tel:${place.phone.replace(/[^+\d]/g, "")}`}
                className="font-bold text-[#123F35] hover:underline tabular-nums"
              >
                {place.phone}
              </a>
            </div>
          )}

          {(place.websiteUrl || place.socialMediaUrl) && (
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[#5A6B66]">
                <Globe className="w-3.5 h-3.5 text-[#168A8A]" />
                <span>Official Page</span>
              </div>
              <a
                href={place.websiteUrl || place.socialMediaUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-[#168A8A]"
              >
                Open Link <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {place.operatingHours.length > 0 && (
            <div className="pt-2 border-t border-[#E5E0D5] space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A6B66]">
                Verified Schedule
              </p>
              <div className="space-y-1 text-xs">
                {place.operatingHours.map((h) => {
                  const isToday = h.dayOfWeek === todayIndex;
                  return (
                    <div
                      key={h.id}
                      className={`flex justify-between gap-2 rounded-lg px-2 py-0.5 ${
                        isToday ? "bg-[#123F35]/8 font-bold text-[#123F35]" : ""
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

          <div className="pt-2 border-t border-[#E5E0D5] text-[10px] text-[#5A6B66] space-y-0.5">
            <p>
              <strong>Source:</strong> {place.sourceReference}
            </p>
            {place.verificationDate && (
              <p>
                <strong>Verified:</strong> {place.verificationDate}
              </p>
            )}
            {place.latitude && place.longitude && (
              <p className="tabular-nums">
                <strong>GPS:</strong> {place.latitude.toFixed(4)}° N,{" "}
                {place.longitude.toFixed(4)}° E
              </p>
            )}
          </div>
        </section>

        {/* Barangay Context Card */}
        {place.barangay && (
          <section className="bg-[#123F35] text-white rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-[#D6A85B]">
              <Compass className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Barangay Context
              </span>
            </div>
            <h3 className="font-display text-base font-bold">
              Brgy. {place.barangay.name}
            </h3>
            <p className="text-xs text-white/85 leading-relaxed">
              {place.barangay.summary}
            </p>
            <Link
              href={`/app/discover?barangay=${encodeURIComponent(place.barangay.slug)}`}
              className="inline-block text-xs font-bold text-[#D6A85B] hover:underline"
            >
              More in Brgy. {place.barangay.name} →
            </Link>
          </section>
        )}

        {/* Continue Exploring Swipe Rail */}
        {place.relatedPlaces.length > 0 && (
          <section className="space-y-2.5 pt-1">
            <h2 className="font-display text-base font-bold text-[#202B28]">
              Continue Exploring Salcedo
            </h2>
            <div className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-1">
              {place.relatedPlaces.map((rel) => (
                <PlaceCard key={rel.id} place={rel} variant="rail" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
