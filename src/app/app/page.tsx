import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  getCategoriesWithCounts,
  getPublishedEvents,
  getPublishedPlaces,
  getPublishedProducts,
} from "@/lib/queries/public-tourism";
import { interests } from "@/lib/guide-interests";
import { HomeHero } from "@/components/app/HomeHero";
import { HomeRankingsCard } from "@/components/app/HomeRankingsCard";
import { PlaceCard } from "@/components/app/PlaceCard";
import { Kicker } from "@/components/ui/FieldGuide";

export const dynamic = "force-dynamic";
const shortlist = [
  "baluarte-falls-agila-falls",
  "bago-resort-spring-water",
  "salcedo-town-plaza-del-pilar-shrine",
];

export default async function TouristHomePage() {
  const [places, categories, events, products] = await Promise.all([
    getPublishedPlaces({ sort: "most_visited" }),
    getCategoriesWithCounts(),
    getPublishedEvents(),
    getPublishedProducts(),
  ]);
  const featured = places.filter((p) => p.isFeatured);
  const priority = (slug: string) =>
    shortlist.includes(slug) ? shortlist.indexOf(slug) : shortlist.length;
  const picks = (featured.length ? featured : [...places])
    .sort((a, b) => priority(a.slug) - priority(b.slug))
    .slice(0, 3);
  return (
    <>
      <HomeHero />
      <nav className="subject-nav" aria-label="Browse by interest">
        <div className="guide-wrap subject-row">
          <span>Browse by interest</span>
          {interests.map((i) => (
            <Link key={i.key} href={`/app/discover?interest=${i.key}`}>
              {i.label}
              <ArrowRight size={14} />
            </Link>
          ))}
        </div>
      </nav>
      <div className="guide-wrap publication">
        <div className="editorial-spread">
          <section aria-labelledby="featured-title">
            <div className="section-heading">
              <h2 id="featured-title">Places to visit</h2>
              <Link className="text-link" href="/app/discover">
                All places <ArrowRight size={15} />
              </Link>
            </div>
            {picks.length ? (
              <div className="shortlist">
                {picks.map((place, i) => (
                  <PlaceCard key={place.id} place={place} number={i + 1} variant="spotlight" />
                ))}
              </div>
            ) : (
              <p className="empty-note">There are no published destinations yet.</p>
            )}
          </section>
          <aside className="crop-story">
            <Kicker>Local produce</Kicker>
            <div className="crop-spread">
              <div>
                <h2>
                  Cacao <br />
                  &amp; tablea
                </h2>
                <p>
                  Cacao grows in Sorioan. In Poblacion, local makers roast and grind the beans into
                  tablea for hot chocolate.
                </p>
                <Link className="text-link" href="/app/salcedo?tab=products">
                  Meet the producers <ArrowRight size={15} />
                </Link>
              </div>
              <Image
                src="/images/salcedo/cacao-plate.webp"
                alt="Botanical plate of a cacao branch, pod and flower"
                width={500}
                height={731}
                sizes="(max-width: 600px) 33vw, 190px"
                unoptimized
              />
            </div>
            <p className="plate-source">
              <em>Theobroma cacao</em> · <a href="/app/more#sources">Flora de Filipinas, pl. 275</a>
            </p>
          </aside>
        </div>
        <div className="editorial-spread below-fold">
          {places.length > 0 && <HomeRankingsCard places={places} categories={categories} />}
          <section className="further-reading">
            <h2>Visitor information</h2>
            <Link href="/app/trips">
              <div>
                <small>Trip planner</small>
                <h3>Plan your stops</h3>
                <p>Save places and arrange them by day on this device.</p>
              </div>
              <ArrowUpRight size={19} />
            </Link>
            {events[0] && (
              <Link href="/app/salcedo?tab=events">
                <div>
                  <small>Festivals &amp; events</small>
                  <h3>{events[0].title}</h3>
                </div>
                <ArrowUpRight size={19} />
              </Link>
            )}
            {products[0] && (
              <Link href="/app/salcedo?tab=products">
                <div>
                  <small>Local products</small>
                  <h3>{products[0].name}</h3>
                </div>
                <ArrowUpRight size={19} />
              </Link>
            )}
            <Link className="text-link" href="/app/more">
              Local guide <ArrowRight size={15} />
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
