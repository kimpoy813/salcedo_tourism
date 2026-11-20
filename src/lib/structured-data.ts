import { absoluteUrl } from "@/lib/site";

const schemaType: Record<string, string> = {
  attraction: "TouristAttraction",
  nature: "TouristAttraction",
  heritage: "TouristAttraction",
  resort: "LodgingBusiness",
  accommodation: "LodgingBusiness",
  restaurant: "Restaurant",
  cafe: "CafeOrCoffeeShop",
  business: "LocalBusiness",
  service: "LocalBusiness",
};

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface StructuredPlace {
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  address: string;
  placeType: string;
  latitude: string | number | null;
  longitude: string | number | null;
  phone?: string | null;
  websiteUrl?: string | null;
  socialMediaUrl?: string | null;
  averageRating: number;
  ratingCount: number;
  barangay?: { name: string } | null;
  images?: string[];
  operatingHours?: Array<{
    dayOfWeek: number;
    isClosed: boolean;
    openTime: string | null;
    closeTime: string | null;
  }>;
}

/** JSON-LD for a destination page. Values mirror the visible page; nothing is invented. */
export function placeJsonLd(place: StructuredPlace) {
  const latitude = Number(place.latitude);
  const longitude = Number(place.longitude);
  const url = absoluteUrl(`/app/places/${place.slug}`);
  const images = (place.images ?? []).map((image) => absoluteUrl(image));
  const openingHours = (place.operatingHours ?? [])
    .filter((row) => !row.isClosed && row.openTime && row.closeTime)
    .map((row) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${dayNames[row.dayOfWeek] ?? "Monday"}`,
      opens: row.openTime?.slice(0, 5),
      closes: row.closeTime?.slice(0, 5),
    }));

  return {
    "@context": "https://schema.org",
    "@type": schemaType[place.placeType] ?? "TouristAttraction",
    name: place.name,
    description: place.description || place.shortDescription || undefined,
    url,
    image: images.length ? images : absoluteUrl("/og/salcedo-guide.jpg"),
    address: {
      "@type": "PostalAddress",
      streetAddress: place.address,
      addressLocality: place.barangay?.name ? `${place.barangay.name}, Salcedo` : "Salcedo",
      addressRegion: "Ilocos Sur",
      addressCountry: "PH",
    },
    geo:
      Number.isFinite(latitude) && Number.isFinite(longitude)
        ? { "@type": "GeoCoordinates", latitude, longitude }
        : undefined,
    telephone: place.phone || undefined,
    sameAs:
      [place.websiteUrl, place.socialMediaUrl].filter(Boolean).length > 0
        ? ([place.websiteUrl, place.socialMediaUrl].filter(Boolean) as string[])
        : undefined,
    openingHoursSpecification: openingHours.length ? openingHours : undefined,
    aggregateRating:
      place.ratingCount > 0 && place.averageRating > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(place.averageRating.toFixed(1)),
            reviewCount: place.ratingCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  };
}

export function jsonLdString(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
