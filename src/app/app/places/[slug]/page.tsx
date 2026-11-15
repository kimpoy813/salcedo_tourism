import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Banknote,
  BedDouble,
  Car,
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  ExternalLink,
  Eye,
  Flame,
  Gem,
  Globe,
  Home,
  MapPin,
  Mountain,
  Phone,
  ShieldAlert,
  Star,
  Ticket,
  Trophy,
  UtensilsCrossed,
  Waves,
  Wifi,
} from "lucide-react";
import { getPublishedPlaceByIdOrSlug } from "@/lib/queries/public-tourism";
import {
  PlaceDetailActions,
  PlaceHeroOverlayControls,
  PlaceRatingsSection,
} from "@/components/app/PlaceDetailClient";
import { PlaceCard } from "@/components/app/PlaceCard";
import { Chip, FeatureTile, InfoRow, SectionHeader, StatTile } from "@/components/ui/design";
import { PlaceGallery, PlacePhotosSection, type GalleryImage } from "@/components/app/PlaceGallery";

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

  // Today + open-now, computed in Philippine time
  const nowPH = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );
  const todayIndex = nowPH.getDay();
  const todayHours = place.operatingHours.find((h) => h.dayOfWeek === todayIndex);
  let openNow: boolean | null = null;
  if (todayHours) {
    if (todayHours.isClosed) {
      openNow = false;
    } else if (todayHours.openTime && todayHours.closeTime) {
      const [oh, om] = todayHours.openTime.split(":").map(Number);
      const [ch, cm] = todayHours.closeTime.split(":").map(Number);
      const nowMins = nowPH.getHours() * 60 + nowPH.getMinutes();
      openNow = nowMins >= oh * 60 + om && nowMins < ch * 60 + cm;
    }
  }
  const categoryLabel = place.primaryCategory?.name || place.placeType;

  // Photo gallery: cover first, then the place's gallery images (deduped)
  const gallery: GalleryImage[] = [];
  const seenUrls = new Set<string>();
  const pushImage = (url?: string | null, caption?: string | null) => {
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      gallery.push({ url, caption: caption ?? null });
    }
  };
  pushImage(place.featuredImageUrl, place.featuredImageCaption);
  for (const img of place.images) pushImage(img.url, img.caption);
  if (gallery.length === 0) pushImage(imageSrc, null);

  return (
    <div className="min-h-full bg-[#FAF9F6]">
      {/* Hero */}
      <section className="relative h-[290px] bg-[#164237] overflow-hidden">
        <PlaceGallery name={place.name} images={gallery} />
        <PlaceHeroOverlayControls place={actionPayload} />
      </section>

      {/* Sheet */}
      <div className="relative z-10 -mt-6 rounded-t-[28px] bg-[#FAF9F6] pt-3 pb-0">
        <div className="px-4 space-y-7">
          <div className="w-10 h-1 rounded-full bg-[#D8D3C8] mx-auto" />

          {/* Header */}
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-[#164237] text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                {categoryLabel}
              </span>
              {place.isHiddenGem && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#B88A44]/15 text-[#8A6527] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                  <Gem className="w-3 h-3" /> Hidden Gem
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1D7874]/10 text-[#164237] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            </div>

            <h1 className="font-display text-[28px] font-bold text-[#1A2421] leading-[1.15]">
              {place.name}
            </h1>

            <p className="flex items-start gap-1.5 text-[13px] text-[#616E69]">
              <MapPin className="w-4 h-4 text-[#1D7874] shrink-0 mt-px" />
              <span>{place.address}</span>
              {openNow !== null && (
                <span
                  className={`ml-1 shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    openNow
                      ? "bg-[#1D7874]/10 text-[#164237]"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${openNow ? "bg-[#1D7874]" : "bg-rose-500"}`}
                  />
                  {openNow ? "Open now" : "Closed"}
                </span>
              )}
            </p>

            <p className="text-[15px] text-[#1A2421]/85 leading-[1.75]">
              {place.description}
            </p>
          </header>

          {/* At a glance — graphic stat tiles */}
          <div className="grid grid-cols-4 gap-2">
            <StatTile
              icon={Star}
              tint="#B88A44"
              value={
                place.ratingCount > 0 ? place.averageRating.toFixed(1) : "—"
              }
              label={
                place.ratingCount > 0
                  ? `${place.ratingCount} rating${place.ratingCount === 1 ? "" : "s"}`
                  : "No ratings"
              }
            />
            <StatTile
              icon={Flame}
              tint="#164237"
              value={`#${place.mostVisitedRank}`}
              label="Most visited"
            />
            <StatTile
              icon={Trophy}
              tint="#1D7874"
              value={`#${place.categoryRank}`}
              label={categoryLabel}
            />
            <StatTile
              icon={Eye}
              tint="#616E69"
              value={
                place.visitCount >= 1000
                  ? `${(place.visitCount / 1000).toFixed(1)}k`
                  : `${place.visitCount}`
              }
              label="Visits"
            />
          </div>

          {/* Photos — more than just the cover */}
          {gallery.length > 1 && (
            <section className="space-y-3">
              <SectionHeader eyebrow="Gallery" title="Photos" description={`${gallery.length} photos of ${place.name}`} />
              <PlacePhotosSection name={place.name} images={gallery} />
            </section>
          )}

          {/* Café */}
          {place.cafeDetails && (
            <section className="space-y-3"><SectionHeader eyebrow="Café" title="Café highlights" /><div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <FeatureTile icon={Wifi} label="Wi-Fi" available={place.cafeDetails.hasWifi} />
                <FeatureTile icon={Car} label="Parking" available={place.cafeDetails.hasParking} />
              </div>
              {place.cafeDetails.priceRangeNote && (
                <div className="rounded-xl bg-[#F3F2EE] px-3 py-2.5 flex items-center gap-2 text-[13px] text-[#1A2421]">
                  <Banknote className="w-4 h-4 text-[#164237] shrink-0" />
                  {place.cafeDetails.priceRangeNote}
                </div>
              )}
              {place.cafeDetails.featuredDrinks?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#616E69]">
                    <Coffee className="w-3.5 h-3.5" /> Drinks
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {place.cafeDetails.featuredDrinks.map((d) => (
                      <Chip key={d}>{d}</Chip>
                    ))}
                  </div>
                </div>
              )}
              {place.cafeDetails.foodOfferings?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#616E69]">
                    <UtensilsCrossed className="w-3.5 h-3.5" /> Food
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {place.cafeDetails.foodOfferings.map((f) => (
                      <Chip key={f}>{f}</Chip>
                    ))}
                  </div>
                </div>
              )}
            </div></section>
          )}

          {/* Stay */}
          {place.accommodationDetails && (
            <section className="space-y-3"><SectionHeader eyebrow="Stay" title="Stay details" /><div className="space-y-3">
              <div className="rounded-2xl bg-white border border-[#EAE7E0] px-4 divide-y divide-[#F0EEE7]">
                {place.accommodationDetails.accommodationType && (
                  <InfoRow icon={Home} label="Type">
                    {place.accommodationDetails.accommodationType}
                  </InfoRow>
                )}
                {place.accommodationDetails.roomTypesSummary && (
                  <InfoRow icon={BedDouble} label="Rooms">
                    {place.accommodationDetails.roomTypesSummary}
                  </InfoRow>
                )}
                {place.accommodationDetails.rateNote && (
                  <InfoRow icon={Banknote} label="Rates">
                    {place.accommodationDetails.rateNote}
                  </InfoRow>
                )}
                {place.accommodationDetails.checkInOutPolicy && (
                  <InfoRow icon={Clock} label="Check-in / out">
                    {place.accommodationDetails.checkInOutPolicy}
                  </InfoRow>
                )}
              </div>
            </div></section>
          )}

          {/* Resort */}
          {place.resortDetails && (
            <section className="space-y-3"><SectionHeader eyebrow="Resort" title="Facilities & rates" /><div className="space-y-3">
              <div className="rounded-2xl bg-white border border-[#EAE7E0] px-4 divide-y divide-[#F0EEE7]">
                {place.resortDetails.poolsSummary && (
                  <InfoRow icon={Waves} label="Pools & water">
                    {place.resortDetails.poolsSummary}
                  </InfoRow>
                )}
                {place.resortDetails.cottagesSummary && (
                  <InfoRow icon={Home} label="Cottages">
                    {place.resortDetails.cottagesSummary}
                  </InfoRow>
                )}
                {place.resortDetails.roomsSummary && (
                  <InfoRow icon={BedDouble} label="Rooms">
                    {place.resortDetails.roomsSummary}
                  </InfoRow>
                )}
                {place.resortDetails.entranceFeeNote && (
                  <InfoRow icon={Ticket} label="Entrance">
                    {place.resortDetails.entranceFeeNote}
                  </InfoRow>
                )}
                {place.resortDetails.cottageRoomRatesNote && (
                  <InfoRow icon={Banknote} label="Rates">
                    {place.resortDetails.cottageRoomRatesNote}
                  </InfoRow>
                )}
              </div>
              {place.resortDetails.recreationalFacilities?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {place.resortDetails.recreationalFacilities.map((fac) => (
                    <Chip key={fac}>{fac}</Chip>
                  ))}
                </div>
              )}
              {place.resortDetails.policies?.length > 0 && (
                <ul className="space-y-1.5">
                  {place.resortDetails.policies.map((pol) => (
                    <li key={pol} className="flex items-start gap-2 text-[13px] text-[#616E69]">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#B88A44] shrink-0 mt-0.5" />
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
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#164237]"
                >
                  Official inquiry page <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div></section>
          )}

          {/* Restaurant */}
          {place.restaurantDetails && (
            <section className="space-y-3"><SectionHeader eyebrow="Dining" title="Dining & specialties" /><div className="space-y-3">
              {place.restaurantDetails.cuisineType && (
                <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#164237]">
                  <UtensilsCrossed className="w-4 h-4" />
                  {place.restaurantDetails.cuisineType}
                </p>
              )}
              {place.restaurantDetails.featuredDishes?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {place.restaurantDetails.featuredDishes.map((dish) => (
                    <Chip key={dish}>{dish}</Chip>
                  ))}
                </div>
              )}
              {place.restaurantDetails.priceRangeNote && (
                <div className="rounded-xl bg-[#F3F2EE] px-3 py-2.5 flex items-center gap-2 text-[13px] text-[#1A2421]">
                  <Banknote className="w-4 h-4 text-[#164237] shrink-0" />
                  {place.restaurantDetails.priceRangeNote}
                </div>
              )}
            </div></section>
          )}

          {/* Attraction */}
          {place.attractionDetails && (
            <section className="space-y-3"><SectionHeader eyebrow="Visit" title="Visitor guide" /><div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {place.attractionDetails.difficultyLevel && (
                  <div className="rounded-2xl bg-white border border-[#EAE7E0] px-2 py-3 text-center space-y-1">
                    <Mountain className="w-4 h-4 mx-auto text-[#164237]" />
                    <p className="text-xs font-bold text-[#1A2421] leading-tight">
                      {place.attractionDetails.difficultyLevel}
                    </p>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-[#616E69]">
                      Access
                    </p>
                  </div>
                )}
                {place.attractionDetails.estimatedDurationMinutes && (
                  <div className="rounded-2xl bg-white border border-[#EAE7E0] px-2 py-3 text-center space-y-1">
                    <Clock className="w-4 h-4 mx-auto text-[#164237]" />
                    <p className="text-xs font-bold text-[#1A2421] leading-tight tabular-nums">
                      ~{place.attractionDetails.estimatedDurationMinutes >= 60
                        ? `${Math.round((place.attractionDetails.estimatedDurationMinutes / 60) * 10) / 10} hr`
                        : `${place.attractionDetails.estimatedDurationMinutes} min`}
                    </p>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-[#616E69]">
                      Duration
                    </p>
                  </div>
                )}
                {place.attractionDetails.entranceInfo && (
                  <div className="rounded-2xl bg-white border border-[#EAE7E0] px-2 py-3 text-center space-y-1">
                    <Ticket className="w-4 h-4 mx-auto text-[#164237]" />
                    <p className="text-xs font-bold text-[#1A2421] leading-tight">
                      {place.attractionDetails.entranceInfo}
                    </p>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-[#616E69]">
                      Entrance
                    </p>
                  </div>
                )}
              </div>

              {place.attractionDetails.activities?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {place.attractionDetails.activities.map((act) => (
                    <Chip key={act}>{act}</Chip>
                  ))}
                </div>
              )}
              {place.attractionDetails.historicalDetails && (
                <p className="text-[13px] text-[#616E69] leading-[1.75]">
                  {place.attractionDetails.historicalDetails}
                </p>
              )}
              {place.attractionDetails.visitorGuidelines?.length > 0 && (
                <div className="rounded-2xl bg-[#B88A44]/10 border border-[#B88A44]/20 p-3.5 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A6527]">
                    Good to know
                  </p>
                  <ul className="space-y-1.5">
                    {place.attractionDetails.visitorGuidelines.map((g) => (
                      <li key={g} className="flex items-start gap-2 text-[13px] text-[#1A2421]/85">
                        <ShieldAlert className="w-3.5 h-3.5 text-[#B88A44] shrink-0 mt-0.5" />
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div></section>
          )}

          {/* Amenities */}
          {place.amenities.length > 0 && (
            <section className="space-y-3"><SectionHeader eyebrow="On site" title="Amenities" /><div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {place.amenities.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#EAE7E0] px-3 py-1.5 text-xs font-medium text-[#1A2421]"
                  >
                    <Check className="w-3 h-3 text-[#1D7874]" />
                    {a.name}
                  </span>
                ))}
              </div>
            </div></section>
          )}

          {/* Practical info */}
          <section className="space-y-3"><SectionHeader eyebrow="Plan" title="Practical info" /><div className="space-y-3">
            <div className="rounded-2xl bg-white border border-[#EAE7E0] px-4 py-1 divide-y divide-[#F0EEE7]">
              {place.phone && (
                <div className="flex items-center justify-between gap-2 py-3">
                  <span className="inline-flex items-center gap-2 text-[13px] text-[#616E69]">
                    <Phone className="w-4 h-4 text-[#164237]" /> Contact
                  </span>
                  <a
                    href={`tel:${place.phone.replace(/[^+\d]/g, "")}`}
                    className="text-[13px] font-semibold text-[#164237] tabular-nums"
                  >
                    {place.phone}
                  </a>
                </div>
              )}
              {(place.websiteUrl || place.socialMediaUrl) && (
                <div className="flex items-center justify-between gap-2 py-3">
                  <span className="inline-flex items-center gap-2 text-[13px] text-[#616E69]">
                    <Globe className="w-4 h-4 text-[#164237]" /> Official link
                  </span>
                  <a
                    href={place.websiteUrl || place.socialMediaUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#164237]"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {place.latitude && place.longitude && (
                <div className="flex items-center justify-between gap-2 py-3">
                  <span className="inline-flex items-center gap-2 text-[13px] text-[#616E69]">
                    <MapPin className="w-4 h-4 text-[#164237]" /> Coordinates
                  </span>
                  <span className="text-[13px] font-medium text-[#1A2421] tabular-nums">
                    {place.latitude.toFixed(4)}°, {place.longitude.toFixed(4)}°
                  </span>
                </div>
              )}
            </div>

            {place.operatingHours.length > 0 && (
              <div className="rounded-2xl bg-white border border-[#EAE7E0] px-4 py-2">
                <p className="flex items-center justify-between pt-1.5 pb-1">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#616E69]">
                    <Clock className="w-3.5 h-3.5" /> Opening hours
                  </span>
                  {openNow !== null && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        openNow ? "bg-[#1D7874]/10 text-[#164237]" : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${openNow ? "bg-[#1D7874]" : "bg-rose-500"}`} />
                      {openNow ? "Open now" : "Closed now"}
                    </span>
                  )}
                </p>
                <div className="divide-y divide-[#F0EEE7]">
                  {[...place.operatingHours]
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map((h) => {
                      const isToday = h.dayOfWeek === todayIndex;
                      return (
                        <div
                          key={h.id}
                          className={`flex justify-between gap-2 py-2 text-[13px] ${
                            isToday ? "font-bold text-[#164237]" : "text-[#616E69]"
                          }`}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            {DAY_NAMES[h.dayOfWeek]}
                            {isToday && (
                              <span className="rounded-full bg-[#164237] text-white px-1.5 py-px text-[9px] font-bold uppercase tracking-wide">
                                Today
                              </span>
                            )}
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

            <p className="text-[11px] text-[#616E69]">Source: {place.sourceReference}</p>
          </div></section>

          {/* Ratings & reviews */}
          <PlaceRatingsSection
            placeId={place.id}
            placeName={place.name}
            initialSummary={place.ratingsSummary}
          />

          {/* Barangay context */}
          {place.barangay && (
            <Link
              href={`/app/discover?barangay=${encodeURIComponent(place.barangay.slug)}`}
              className="block rounded-2xl bg-white border border-[#EAE7E0] p-4 space-y-1.5 active:bg-[#F3F2EE] transition"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1D7874]">
                Barangay
              </p>
              <p className="font-display text-base font-bold text-[#1A2421]">
                Brgy. {place.barangay.name}
              </p>
              <p className="text-[13px] text-[#616E69] leading-relaxed line-clamp-2">
                {place.barangay.summary}
              </p>
              <span className="inline-block text-xs font-semibold text-[#164237] pt-0.5">
                See more in Brgy. {place.barangay.name} →
              </span>
            </Link>
          )}
        </div>

        {/* Related */}
        {place.relatedPlaces.length > 0 && (
          <section className="space-y-3 pt-6">
            <div className="px-4 space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1D7874]">
                Keep exploring
              </p>
              <h2 className="font-display text-lg font-bold text-[#1A2421]">
                More in Salcedo
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar px-4 scroll-px-4 pb-1 after:content-[''] after:w-1 after:shrink-0">
              {place.relatedPlaces.map((rel) => (
                <PlaceCard key={rel.id} place={rel} variant="rail" />
              ))}
            </div>
          </section>
        )}

        <PlaceDetailActions place={actionPayload} />
      </div>
    </div>
  );
}
