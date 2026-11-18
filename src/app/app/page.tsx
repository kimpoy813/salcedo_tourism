import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Coffee,
  Landmark,
  Mountain,
  Route,
  Waves,
} from "lucide-react";
import {
  getCategoriesWithCounts,
  getPublishedEvents,
  getPublishedPlaces,
  getPublishedProducts,
} from "@/lib/queries/public-tourism";
import { interests } from "@/lib/guide-interests";
import { HomeHero } from "@/components/app/HomeHero";
import { PlaceCard } from "@/components/app/PlaceCard";
import { HomeRankingsCard } from "@/components/app/HomeRankingsCard";
import { Kicker } from "@/components/ui/FieldGuide";

export const dynamic = "force-dynamic";
const interestIcons = [Mountain, Waves, Coffee, Landmark];
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
  const picks = [...featured]
    .sort(
      (a, b) =>
        (shortlist.includes(a.slug) ? shortlist.indexOf(a.slug) : 99) -
        (shortlist.includes(b.slug) ? shortlist.indexOf(b.slug) : 99),
    )
    .slice(0, 3);
  const event = events[0];
  const product = products[0];
  return (
    <>
      <HomeHero />
      <nav className="interest-bar" aria-label="Browse by interest">
        <div className="guide-wrap interest-layout">
          {interests.map((interest, i) => {
            const Icon = interestIcons[i];
            return (
              <Link
                key={interest.key}
                href={`/app/discover?interest=${interest.key}`}
                className={`interest-link interest-${interest.key}`}
              >
                <span className="interest-icon">
                  <Icon size={24} strokeWidth={1.5} />
                </span>
                <span>
                  <strong>{interest.label}</strong>
                  <small>{interest.note}</small>
                </span>
                <ChevronRight className="interest-arrow" size={14} />
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="guide-wrap home-sections">
        <section aria-labelledby="featured-title">
          <div className="section-heading">
            <div>
              <Kicker>The local shortlist</Kicker>
              <h2 id="featured-title">Featured destinations</h2>
            </div>
            <Link className="text-link" href="/app/discover">
              Explore all places <ArrowRight size={16} />
            </Link>
          </div>
          {picks.length || places.length ? (
            <div className="places-grid">
              {(picks.length ? picks : places.slice(0, 3)).map((place) => (
                <PlaceCard key={place.id} place={place} variant="spotlight" />
              ))}
            </div>
          ) : (
            <p className="empty-note">
              New destinations will appear here as the local directory grows.
            </p>
          )}
        </section>
        <div className="home-secondary">
          {places.length > 0 && <HomeRankingsCard places={places} categories={categories} />}
          <aside className="notebook-callout">
            <Image
              src="/images/salcedo/gallery-mountain-viewpoint.jpg"
              alt=""
              fill
              sizes="(max-width: 780px) 100vw, 40vw"
            />
            <div className="notebook-shade" />
            <div className="notebook-content">
              <Kicker>Your trip notebook</Kicker>
              <h2>
                Make a day
                <br />
                of <em>Salcedo.</em>
              </h2>
              <p>
                Pick your stops, plan your days, and take your itinerary with you. No account
                needed.
              </p>
              <Link className="cream-button" href="/app/trips">
                <Route size={16} /> Plan my trip <ArrowRight size={15} />
              </Link>
            </div>
          </aside>
        </div>
        {(event || product) && (
          <section>
            <div className="section-heading">
              <div>
                <Kicker>Local life</Kicker>
                <h2>From the community</h2>
              </div>
              <Link className="text-link" href="/app/more">
                Local guide <ArrowRight size={16} />
              </Link>
            </div>
            <div className="local-notes">
              {event && (
                <Link href="/app/salcedo?tab=events">
                  <Image src="/images/salcedo/plaza-heritage.png" alt="" width={112} height={96} />
                  <div>
                    <small>Festivals & events</small>
                    <h3>{event.title}</h3>
                  </div>
                  <ArrowUpRight size={17} />
                </Link>
              )}
              {product && (
                <Link href="/app/salcedo?tab=products">
                  <Image
                    src={product.imageUrl || "/images/salcedo/rambutan-cacao-harvest.png"}
                    alt=""
                    width={112}
                    height={96}
                  />
                  <div>
                    <small>Local harvest</small>
                    <h3>{product.name}</h3>
                  </div>
                  <ArrowUpRight size={17} />
                </Link>
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
