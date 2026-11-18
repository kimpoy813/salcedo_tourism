"use client";

import Link from "next/link";
import { Bookmark, Check, Plus, Star } from "lucide-react";
import { typeLabels } from "@/lib/guide-interests";
import { listingImage, snapshotMedia, type ListingMedia } from "@/lib/visitor-media";
import { useMobileApp } from "./MobileAppContext";
import { GuideImage, PlaceThumbnail } from "./GuideImage";

export interface PlaceCardData extends ListingMedia {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  placeType: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
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

function PlaceActions({place}:{place:PlaceCardData}) {
  const {savedPlaceIds,draftStopIds,toggleBookmark,addPlaceToActiveDraft} = useMobileApp();
  const saved = savedPlaceIds.includes(place.id), added=draftStopIds.includes(place.id);
  const snapshot = {id:place.id,name:place.name,slug:place.slug,placeType:place.placeType,barangayName:place.barangay?.name??null,...snapshotMedia(place),latitude:place.latitude??null,longitude:place.longitude??null};
  return <div className="place-commands">
    {added ? <Link href="/app/trips" className="trip-command"><Check size={15}/> In my trip</Link> : <button type="button" className="trip-command" aria-label={`Add to trip: ${place.name}`} onClick={()=>void addPlaceToActiveDraft(snapshot)}><Plus size={15}/> Add to trip</button>}
    <button type="button" className="bookmark-command" aria-label={`${saved?"Unsave":"Save"} ${place.name}`} aria-pressed={saved} title={saved?"Remove from saved places":"Save place"} onClick={()=>void toggleBookmark(place.id,place.name,snapshot)}><Bookmark size={17} fill={saved?"currentColor":"none"}/></button>
  </div>;
}
function Rating({place}:{place:PlaceCardData}) {
  const n = place.ratingCount ?? 0;
  if (!n || place.averageRating == null) return <span className="unrated">Not yet rated</span>;
  return <span className="visitor-rating"><Star size={13} aria-hidden="true" fill="currentColor"/><strong>{place.averageRating.toFixed(1)}</strong><span className="sr-only"> out of 5, </span><span>({n}<span className="sr-only"> {n===1?"rating":"ratings"}</span>)</span></span>;
}
function shortName(p:PlaceCardData){ return p.name.split(" (")[0]; }

/** Visual entries on the cover and related-places shelf. The directory itself
 * is a comparison table rather than another wall of cards. */
export function PlaceCard({place,variant}:{place:PlaceCardData;variant?:"rail"}) {
  const image=listingImage(place); const href=`/app/places/${place.slug}`;
  return <article className={`destination-preview${variant==='rail'?' related-place':''}`}>
    {image && <Link href={href} className="destination-picture" aria-hidden="true" tabIndex={-1}><GuideImage src={image.url} size="cover" width={800} height={408} sizes="(max-width: 650px) 100vw, 32vw" alt=""/>{image.kind==='illustration' && <span>Illustration</span>}</Link>}
    <div className="destination-meta">{typeLabels[place.placeType]||"Destination"}<span aria-hidden="true"> · </span>{place.barangay?.name ? `Brgy. ${place.barangay.name}` : "Salcedo"}</div>
    <h3><Link href={href} title={place.name}>{shortName(place)}</Link></h3>
    <p>{place.shortDescription}</p>
    <div className="destination-foot"><Rating place={place}/><PlaceActions place={place}/></div>
  </article>;
}
export function PlaceDirectoryTable({places,label}:{places:PlaceCardData[];label:string}) {
  return <table className="place-register">
    <caption className="sr-only">{label}</caption>
    <thead><tr><th scope="col">Destination</th><th scope="col">Barangay</th><th scope="col">Visitor rating</th><th scope="col">Trip planner</th></tr></thead>
    <tbody>{places.map(p=><tr key={p.id}>
      <th scope="row"><div className="register-place"><PlaceThumbnail place={p} className="register-thumb" width={76} height={58}/><span><Link href={`/app/places/${p.slug}`} title={p.name}>{shortName(p)}</Link><small>{typeLabels[p.placeType]||"Destination"}{p.barangay?.name && <span className="compact-locality" aria-hidden="true"> · Brgy. {p.barangay.name}</span>}</small></span></div></th>
      <td className="register-area">{p.barangay?.name ? <><span className="compact-prefix">Brgy. </span>{p.barangay.name}</> : '—'}</td>
      <td className="register-rating"><Rating place={p}/></td>
      <td className="register-actions"><PlaceActions place={p}/></td>
    </tr>)}</tbody>
  </table>;
}
