import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { getCategoriesWithCounts, getPublishedPlaces } from "@/lib/queries/public-tourism";
import { HomeHero } from "@/components/app/HomeHero";
import { HomeRankingsCard } from "@/components/app/HomeRankingsCard";
import { PlaceCard } from "@/components/app/PlaceCard";

export const dynamic = "force-dynamic";
const shortlist = ["baluarte-falls-agila-falls", "bago-resort-spring-water", "salcedo-town-plaza-del-pilar-shrine"];
const visitLinks = [
  ["/app/trips", "Trip planner", "Group your stops by day and save an itinerary."],
  ["/app/salcedo?tab=events", "Municipal calendar", "Dates and venues for festivals and local events."],
  ["/app/salcedo?tab=products", "Local products", "Cacao tablea, rambutan and their producers."],
  ["/app/more", "Visitor information", "Barangays, travel advice and emergency contacts."],
];
export default async function TouristHomePage() {
  const [places, categories] = await Promise.all([getPublishedPlaces({sort:"most_visited"}),getCategoriesWithCounts()]);
  const featured = places.filter(p=>p.isFeatured);
  const priority = (slug:string) => shortlist.includes(slug) ? shortlist.indexOf(slug) : shortlist.length;
  const picks = (featured.length ? featured : [...places]).sort((a,b)=>priority(a.slug)-priority(b.slug)).slice(0,3);
  const ranked = places.map(({id,name,slug,mostVisitedRank,topRatedRank,categoryRank,averageRating,ratingCount,barangay,primaryCategory})=>({id,name,slug,mostVisitedRank,topRatedRank,categoryRank,averageRating,ratingCount,barangay:barangay && {name:barangay.name,slug:barangay.slug},primaryCategory:primaryCategory && {name:primaryCategory.name,slug:primaryCategory.slug}}));
  return <>
    <HomeHero />
    <div className="guide-wrap visitor-sections">
      <section aria-labelledby="featured-title">
        <div className="section-heading"><h2 id="featured-title">Places to visit</h2><Link className="text-link" href="/app/discover">View directory <ArrowRight size={15}/></Link></div>
        {picks.length ? <div className="featured-places">{picks.map(p=><PlaceCard key={p.id} place={p}/>)}</div> : <p className="empty-note">There are no published destinations yet.</p>}
      </section>
      <div className="visitor-resources">
        {places.length>0 && <HomeRankingsCard places={ranked} categories={categories}/>}
        <section className="visit-links"><h2>Plan your visit</h2>{visitLinks.map(([href,label,note])=><Link key={href} href={href}><span><strong>{label}</strong><small>{note}</small></span><ChevronRight size={17}/></Link>)}</section>
      </div>
    </div>
  </>;
}
