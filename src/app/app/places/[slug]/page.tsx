import Link from "next/link";
import {cache} from "react";
import {notFound} from "next/navigation";
import {ArrowRight, ExternalLink, MapPin, Star} from "lucide-react";
import {getPublishedPlaceByIdOrSlug} from "@/lib/queries/public-tourism";
import {placeMedia} from "@/lib/visitor-media";
import {typeLabels} from "@/lib/guide-interests";
import {PlaceDetailActions, PlaceTools, PlaceRatingsSection} from "@/components/app/PlaceDetailClient";
import {PlaceCard} from "@/components/app/PlaceCard";
import {PlaceGallery} from "@/components/app/PlaceGallery";
import {PlaceLocator} from "@/components/app/PlaceLocator";
import {FactList, type Fact} from "@/components/ui/FactList";

export const dynamic="force-dynamic";
const loadPlace=cache(getPublishedPlaceByIdOrSlug);
export async function generateMetadata({params}:{params:Promise<{slug:string}>}) {
 const p=await loadPlace((await params).slug);return {title:p?.name||"Place not found",description:p?.shortDescription};
}
const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const yesNo=(v:boolean|null|undefined)=>v==null?null:v?'Available':'Not available';
const descriptionList=(items?:string[]|null)=>items?.length?items.join('; '):null;

// A contact string may list multiple offices. Never concatenate their numbers into one tel link.
function PhoneContact({value}:{value:string}) {
 const parts=value.split(/((?:\+?\d[\d ()-]{5,}\d))/g);
 return <>{parts.map((part,i)=>/^\+?\d[\d ()-]{5,}\d$/.test(part) ? <a key={i} href={`tel:${part.replace(/[^+\d]/g,'')}`}>{part}</a> : part)}</>;
}

export default async function PlaceDetailPage({params}:{params:Promise<{slug:string}>}) {
 const place=await loadPlace((await params).slug);if(!place)notFound();
 const media=placeMedia(place.featuredImageUrl,place.featuredImageCaption,place.images);
 const lead=media[0];
 const payload={id:place.id,name:place.name,slug:place.slug,placeType:place.placeType,barangayName:place.barangay?.name,featuredImageUrl:lead?.kind==='photo'?lead.url:null,displayIllustrationUrl:lead?.kind==='illustration'?lead.url:null,latitude:place.latitude,longitude:place.longitude};
 const [name,...aliases]=place.name.split(' (');
 const phTime=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Manila',weekday:'long',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
 const part=(type:string)=>phTime.find(p=>p.type===type)?.value || '';
 const today=days.indexOf(part('weekday')), now=`${part('hour')}:${part('minute')}`;
 const hours=place.operatingHours.find(h=>h.dayOfWeek===today);
 const open=hours?.isClosed?false:hours?.openTime && hours.closeTime?now>=hours.openTime.slice(0,5)&&now<hours.closeTime.slice(0,5):null;
 const a=place.attractionDetails,r=place.resortDetails,c=place.cafeDetails,food=place.restaurantDetails,stay=place.accommodationDetails;
 const facts:Fact[]=[['Access',a?.difficultyLevel],['Typical visit',a?.estimatedDurationMinutes!=null?`${a.estimatedDurationMinutes} min`:null],['Admission',a?.entranceInfo || r?.entranceFeeNote],['Activities',descriptionList(a?.activities)],['Pools',r?.poolsSummary],['Cottages',r?.cottagesSummary],['Resort rooms',r?.roomsSummary],['Resort rates',r?.cottageRoomRatesNote],['Facilities',descriptionList(r?.recreationalFacilities)],['Accommodation',stay?.accommodationType],['Rooms',stay?.roomTypesSummary],['Room rates',stay?.rateNote],['Check-in / out',stay?.checkInOutPolicy],['Room amenities',descriptionList(stay?.amenitiesSummary)],['Cuisine',food?.cuisineType],['Specialties',descriptionList(food?.featuredDishes)],['Dining options',descriptionList(food?.diningOptions)],['Menu highlights',descriptionList(food?.menuHighlights)],['Food prices',food?.priceRangeNote || c?.priceRangeNote],['Drinks',descriptionList(c?.featuredDrinks)],['Food',descriptionList(c?.foodOfferings)],['Seating',descriptionList(c?.seatingOptions)],['Coffee',c?.brewStyleNote],['Wi-Fi',yesNo(c?.hasWifi)],['Parking',yesNo(c?.hasParking ?? food?.hasParking)]];
 const guidelines=[...(a?.visitorGuidelines||[]),...(r?.policies||[])];
 const locator=<PlaceLocator name={place.name} slug={place.slug} latitude={place.latitude} longitude={place.longitude} area={place.barangay?.name}/>;
 return <div className="guide-wrap place-sheet">
   <div className="sheet-nav"><nav aria-label="Breadcrumb"><Link href="/app/">Home</Link><span>/</span><Link href="/app/discover">Place directory</Link></nav><PlaceTools place={payload}/></div>
   <div className="sheet-lead"><header><p className="place-classification">{place.primaryCategory?.name || typeLabels[place.placeType] || place.placeType}</p><h1>{name}</h1>{aliases.length>0 && <p className="alt-name">{aliases.join(' (').replace(/\)$/,'')}</p>}
    <p className="sheet-address"><MapPin size={16}/>{place.address}</p></header>
    <div className="sheet-media">{lead?<PlaceGallery name={name} images={media}/>:locator}</div>
    <div className="sheet-summary"><p className="sheet-intro">{place.shortDescription}</p>
    <div className="sheet-status">{place.ratingCount>0 && <a href="#community-reviews"><Star size={14}/>{place.averageRating.toFixed(1)} <span>({place.ratingCount} {place.ratingCount===1?"rating":"ratings"})</span></a>}{open!==null && <span className="opening-state">{open?'Open now':'Closed now'}</span>}</div>
    <PlaceDetailActions place={payload}/></div>
   </div>
   <div className="sheet-body"><div className="sheet-main">
     <section><h2>About this place</h2><p>{place.description}</p>{a?.historicalDetails && <p>{a.historicalDetails}</p>}</section>
     {facts.some(([,v])=>v!=null&&v!=='') && <section><h2>Visit details</h2><FactList rows={facts}/>{r?.externalInquiryUrl && <a className="text-link" href={r.externalInquiryUrl} target="_blank" rel="noopener noreferrer">Resort enquiries <ExternalLink size={14}/></a>}</section>}
     {place.amenities.length>0 && <section><h2>Amenities</h2><ul className="amenities-list">{place.amenities.map(v=><li key={v.id}>{v.name}{!v.available && ' (not available)'}</li>)}</ul></section>}
     {guidelines.length>0 && <section><h2>Before you go</h2><ul className="visit-notes">{guidelines.map((v,i)=><li key={i}>{v}</li>)}</ul></section>}
     <details className="directory-record"><summary>Directory record</summary><FactList rows={[["Most visited rank",`#${place.mostVisitedRank}`],["Rank in category",`#${place.categoryRank}`],["Page views + recorded arrivals",place.visitCount],["Source",place.sourceReference],["Verification date",place.verificationDate]]}/></details>
   </div><aside className="visit-contact">
     <section><h2>Location &amp; contact</h2>{lead && locator}<FactList rows={[["Address",place.address],["Phone",place.phone && <PhoneContact value={place.phone}/>],["Email",place.email && <a href={`mailto:${place.email}`}>{place.email}</a>],["Booking",stay?.bookingInquiryUrl && <a href={stay.bookingInquiryUrl}>Booking enquiries</a>],["Website",place.websiteUrl && <a href={place.websiteUrl}>Visit website</a>],["Social media",place.socialMediaUrl && <a href={place.socialMediaUrl}>Visit page</a>]]}/>{place.barangay && <Link className="text-link" href={`/app/discover?barangay=${encodeURIComponent(place.barangay.slug)}`}>More in Brgy. {place.barangay.name} <ArrowRight size={14}/></Link>}</section>
     {place.operatingHours.length>0 && <details className="weekly-hours"><summary>Opening hours <small>Philippine time</small></summary><dl>{[...place.operatingHours].sort((a,b)=>a.dayOfWeek-b.dayOfWeek).map(h=><div key={h.id} className={h.dayOfWeek===today?'is-today':''}><dt>{days[h.dayOfWeek]}{h.dayOfWeek===today?' (today)':''}</dt><dd>{h.isClosed?'Closed':h.openTime && h.closeTime?`${h.openTime.slice(0,5)} – ${h.closeTime.slice(0,5)}`:'Not listed'}</dd></div>)}</dl></details>}
   </aside></div>
   <div id="community-reviews" className="detail-reviews"><PlaceRatingsSection placeId={place.id} placeName={place.name} initialSummary={place.ratingsSummary}/></div>
   {place.relatedPlaces.length>0 && <section className="detail-related"><div className="section-heading"><h2>More in Salcedo</h2><Link className="text-link" href="/app/discover">Place directory <ArrowRight size={15}/></Link></div><div className="related-rail">{place.relatedPlaces.map(p=><PlaceCard key={p.id} place={p} variant="rail"/>)}</div></section>}
 </div>;
}
