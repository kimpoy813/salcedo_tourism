"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronRight,
  MapPin,
  Mountain,
  Navigation,
  Plus,
  Star,
  X,
} from "lucide-react";
import {
  directionsUrl,
  placeTone,
  shortName,
  TONES,
  type MappedPlace,
  type MapHit,
} from "@/lib/geo/atlas";
import { typeLabels } from "@/lib/guide-interests";
import { useMobileApp } from "../MobileAppContext";

function Photo({ p, size }: { p: MappedPlace; size: number }) {
  return (
    <Image
      className="atlas-photo"
      alt=""
      src={p.featuredImageUrl || "/images/salcedo/guide-valley.webp"}
      width={size}
      height={size}
      sizes={`${size}px`}
    />
  );
}
function TypeFlag({ p }: { p: MappedPlace }) {
  return (
    <span className="atlas-type">
      <i style={{ background: TONES[placeTone(p)].color }} />
      {typeLabels[p.placeType] || "Destination"}
    </span>
  );
}
export function PlaceIndex({
  pins,
  selectedId,
  onPlace,
}: {
  pins: MappedPlace[];
  selectedId?: string;
  onPlace: (p: MappedPlace) => void;
}) {
  return (
    <ol className="atlas-index">
      {pins.map((p, i) => (
        <li key={p.id}>
          <button
            type="button"
            aria-pressed={selectedId === p.id}
            aria-label={`Show ${p.name}`}
            onClick={() => onPlace(p)}
          >
            <span className="atlas-photo-frame">
              <Photo p={p} size={66} />
              <small>{String(i + 1).padStart(2, "0")}</small>
            </span>
            <span className="atlas-index-text">
              <TypeFlag p={p} />
              <strong>{shortName(p.name)}</strong>
              <span>
                <MapPin size={11} />
                {p.barangay?.name || "Salcedo"}
              </span>
            </span>
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ol>
  );
}
export function PlacePreview({
  place,
  landmark,
  elevation,
  onClose,
}: {
  place?: MappedPlace;
  landmark: MapHit | null;
  elevation?: number;
  onClose: () => void;
}) {
  const {
    savedPlaceIds,
    draftStopIds,
    toggleBookmark,
    addPlaceToActiveDraft,
    showToast,
  } = useMobileApp();
  const heading = useRef<HTMLHeadingElement>(null),
    [writing, setWriting] = useState(false);
  const targetId = place?.id || landmark?.id;
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [targetId]);
  function close() {
    heading.current
      ?.closest(".atlas-stage")
      ?.querySelector<HTMLElement>(".atlas-surface")
      ?.focus({ preventScroll: true });
    onClose();
  }
  async function write(action: () => Promise<boolean>) {
    if (writing) return;
    setWriting(true);
    try {
      await action();
    } catch {
      showToast(
        "Could not save on this device. Check browser storage and try again.",
        { tone: "info" },
      );
    } finally {
      setWriting(false);
    }
  }
  if (!place && !landmark) return null;
  const saved = !!place && savedPlaceIds.includes(place.id),
    inTrip = !!place && draftStopIds.includes(place.id);
  const snapshot = place && {
    id: place.id,
    name: place.name,
    slug: place.slug,
    placeType: place.placeType,
    barangayName: place.barangay?.name ?? null,
    featuredImageUrl: place.featuredImageUrl ?? null,
    latitude: place.latitude,
    longitude: place.longitude,
  };
  const point = (place || landmark)!;
  return (
    <section
      className="atlas-preview"
      aria-label="Selected map location"
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
    >
      <div className="atlas-preview-lead">
        {place && <Photo p={place} size={72} />}
        <div>
          {place ? (
            <TypeFlag p={place} />
          ) : (
            <span className="atlas-eyebrow">
              {landmark?.kind === "water"
                ? "Waterway"
                : landmark?.kind === "road"
                  ? "Local road"
                  : "Map search"}
            </span>
          )}
          <h2 ref={heading} tabIndex={-1}>
            {place ? shortName(place.name) : landmark?.label}
          </h2>
          <p>
            {place ? (
              <>
                <MapPin size={12} />
                {place.barangay ? `Brgy. ${place.barangay.name}` : "Salcedo"}
                {!!place.ratingCount &&
                  typeof place.averageRating === "number" && (
                    <>
                      <span>·</span>
                      <Star aria-label="Rating" size={11} />
                      {place.averageRating.toFixed(1)}
                    </>
                  )}
                {elevation != null && (
                  <>
                    <span>·</span>
                    <Mountain size={12} />
                    {Math.round(elevation)} m
                  </>
                )}
              </>
            ) : (
              landmark?.subtitle
            )}
          </p>
        </div>
      </div>
      <button
        type="button"
        className="atlas-close"
        aria-label="Close map preview"
        onClick={close}
      >
        <X size={16} />
      </button>
      <div className="atlas-preview-actions">
        {place && (
          <Link className="atlas-view" href={`/app/places/${place.slug}`}>
            View place <ArrowUpRight size={13} />
          </Link>
        )}
        <a
          href={directionsUrl(point.latitude, point.longitude)}
          target="_blank"
          rel="noreferrer"
          aria-label="Directions in Google Maps (opens in a new tab)"
        >
          <Navigation size={13} />
          Directions
        </a>
        {place && snapshot && (
          <>
            {inTrip ? (
              <Link href="/app/trips">
                <Check size={14} />
                In my trip
              </Link>
            ) : (
              <button
                disabled={writing}
                onClick={() =>
                  void write(() => addPlaceToActiveDraft(snapshot))
                }
              >
                <Plus size={14} />
                Add to trip
              </button>
            )}
            <button
              className="atlas-save"
              aria-pressed={saved}
              aria-label={`${saved ? "Unsave" : "Save"} ${place.name}`}
              title={saved ? "Remove bookmark" : "Save place"}
              disabled={writing}
              onClick={() =>
                void write(() => toggleBookmark(place.id, place.name, snapshot))
              }
            >
              <Bookmark size={14} fill={saved ? "currentColor" : "none"} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
