"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Bookmark, Check, Plus, Star } from "lucide-react";
import { typeLabels } from "@/lib/guide-interests";
import { listingPhoto } from "@/lib/visitor-media";
import { useMobileApp } from "./MobileAppContext";

export interface PlaceCardData {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  placeType: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  displayPhotoUrl?: string | null;
  featuredImageUrl?: string | null;
  isFeatured?: boolean;
  isHiddenGem?: boolean;
  averageRating?: number;
  ratingCount?: number;
  viewCount?: number;
  arrivalsCount?: number;
  itineraryCount?: number;
  visitCount?: number;
  mostVisitedRank?: number;
  topRatedRank?: number;
  categoryRank?: number;
  barangay?: { name: string; slug: string } | null;
  primaryCategory?: { id?: string; name: string; slug: string } | null;
}

export function PlaceCard({
  place,
  variant = "card",
  number,
}: {
  place: PlaceCardData;
  variant?: "card" | "rail" | "spotlight";
  number?: number;
}) {
  const { savedPlaceIds, draftStopIds, toggleBookmark, addPlaceToActiveDraft } = useMobileApp();
  const saved = savedPlaceIds.includes(place.id);
  const added = draftStopIds.includes(place.id);
  const snapshot = {
    id: place.id,
    name: place.name,
    slug: place.slug,
    placeType: place.placeType,
    barangayName: place.barangay?.name ?? null,
    featuredImageUrl: listingPhoto(place),
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
  };
  const href = `/app/places/${place.slug}`;
  const shortName = place.name.split(" (")[0];
  const photo = listingPhoto(place);
  return (
    <article className={`place-entry entry-${variant}`}>
      <div className="entry-index" aria-hidden="true">
        {number != null && String(number).padStart(2, "0")}
      </div>
      <div className="entry-description">
        <div className="entry-type">{typeLabels[place.placeType] || "Destination"}</div>
        <h3>
          <Link href={href} title={place.name}>
            {shortName}
          </Link>
        </h3>
        <p>{place.shortDescription}</p>
      </div>
      {photo && (
        <Link href={href} className="entry-photo" tabIndex={-1} aria-hidden="true">
          <Image src={photo} alt="" width={110} height={84} sizes="100px" />
        </Link>
      )}
      <div className="entry-location">
        <span>{place.barangay ? `Brgy. ${place.barangay.name}` : "Salcedo"}</span>
        {Boolean(place.ratingCount) && (
          <span className="place-rating">
            <Star size={12} aria-label="Rating" />
            {place.averageRating?.toFixed(1)}
          </span>
        )}
      </div>
      <div className="entry-actions">
        <Link href={href} className="entry-view" aria-label={`View place: ${place.name}`}>
          View place <ArrowUpRight size={14} />
        </Link>
        {added ? (
          <Link className="entry-add" href="/app/trips">
            <Check size={14} /> In my trip
          </Link>
        ) : (
          <button
            type="button"
            className="entry-add"
            onClick={() => void addPlaceToActiveDraft(snapshot)}
            aria-label={`Add to trip: ${place.name}`}
          >
            <Plus size={14} /> Add to trip
          </button>
        )}
        <button
          type="button"
          className="entry-save"
          title={saved ? "Remove from saved places" : "Save place"}
          aria-pressed={saved}
          aria-label={`${saved ? "Unsave" : "Save"} ${place.name}`}
          onClick={() => void toggleBookmark(place.id, place.name, snapshot)}
        >
          <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
    </article>
  );
}
