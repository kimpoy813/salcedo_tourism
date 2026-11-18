"use client";

import Link from "next/link";
import Image from "next/image";
import { Bookmark, Check, MapPin, Plus, Star } from "lucide-react";
import { typeLabels } from "@/lib/guide-interests";
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
  rankBadge,
}: {
  place: PlaceCardData;
  variant?: "card" | "rail" | "spotlight";
  rankBadge?: { rank: number; label?: string } | null;
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
    featuredImageUrl: place.featuredImageUrl ?? null,
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
  };
  const href = `/app/places/${place.slug}`;
  const shortName = place.name.split(" (")[0];
  return (
    <article className={`place-card place-${variant}`}>
      <div className="place-image">
        <Link href={href} aria-label={`Explore ${place.name}`} tabIndex={-1}>
          <Image
            src={place.featuredImageUrl || "/images/salcedo/hero-salcedo-valley.png"}
            alt={place.name}
            fill
            sizes={
              variant === "rail"
                ? "270px"
                : "(max-width: 600px) 92vw, (max-width: 900px) 45vw, (max-width: 1500px) 30vw, 425px"
            }
          />
        </Link>
        <span className="photo-tag">
          <i className={`type-dot type-${place.placeType}`} />
          {typeLabels[place.placeType] || "Destination"}
        </span>
        <button
          type="button"
          className={`photo-save ${saved ? "is-saved" : ""}`}
          aria-pressed={saved}
          aria-label={`${saved ? "Unsave" : "Save"} ${place.name}`}
          title={saved ? "Remove from saved places" : "Save place"}
          onClick={() => void toggleBookmark(place.id, place.name, snapshot)}
        >
          <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
        </button>
        {rankBadge && (
          <span className="photo-rank">
            #{rankBadge.rank} {rankBadge.label}
          </span>
        )}
      </div>
      <div className="place-body">
        <div className="place-meta">
          <span>
            <MapPin size={13} />
            {place.barangay ? `Brgy. ${place.barangay.name}` : "Salcedo"}
          </span>
          {Boolean(place.ratingCount) && (
            <span className="place-rating">
              <Star size={13} fill="currentColor" />
              {place.averageRating?.toFixed(1)}
            </span>
          )}
        </div>
        <h3>
          <Link href={href} title={place.name}>
            {shortName}
          </Link>
        </h3>
        <p>{place.shortDescription}</p>
        <div className="place-actions">
          <Link href={href}>
            View place <span aria-hidden="true">↗</span>
          </Link>
          {added ? (
            <Link className="add-stop added" href="/app/trips">
              <Check size={14} /> In my trip
            </Link>
          ) : (
            <button
              className="add-stop"
              onClick={() => void addPlaceToActiveDraft(snapshot)}
              aria-label={`Add ${place.name} to trip`}
            >
              <Plus size={14} />
              Add to trip
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
