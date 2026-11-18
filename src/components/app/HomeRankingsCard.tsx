"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, Star } from "lucide-react";
import type { PlaceCardData } from "./PlaceCard";

const modes = [
  { key: "most_visited", title: "Most visited" },
  { key: "top_rated", title: "Top rated" },
  { key: "by_category", title: "By category" },
] as const;
export function HomeRankingsCard({
  places,
  categories,
}: {
  places: Pick<PlaceCardData, 'id' | 'name' | 'slug' | 'mostVisitedRank' | 'topRatedRank' | 'categoryRank' | 'averageRating' | 'ratingCount' | 'barangay' | 'primaryCategory'>[];
  categories: { id: string; slug: string; name: string; publishedCount: number }[];
}) {
  const [mode, setMode] = useState<(typeof modes)[number]["key"]>("most_visited");
  const cats = categories.filter((c) => c.publishedCount > 0);
  const [category, setCategory] = useState(cats[0]?.slug ?? "");
  const key =
    mode === "most_visited"
      ? "mostVisitedRank"
      : mode === "top_rated"
        ? "topRatedRank"
        : "categoryRank";
  const list = places
    .filter((p) => mode !== "by_category" || p.primaryCategory?.slug === category)
    .sort((a, b) => (a[key] ?? Infinity) - (b[key] ?? Infinity))
    .slice(0, 4);
  return (
    <section className="favorites">
      <div className="section-heading">
        <div>
          <h2>Visitor rankings</h2>
        </div>
        <Link
          className="text-link"
          aria-label="View all ranked places"
          href={`/app/discover?sort=${mode}${mode === "by_category" ? `&category=${encodeURIComponent(category)}` : ""}`}
        >
          View all <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="guide-tabs" aria-label="Rank places">
        {modes.map((m) => (
          <button key={m.key} aria-pressed={m.key === mode} onClick={() => setMode(m.key)}>
            {m.title}
          </button>
        ))}
      </div>
      {mode === "by_category" && (
        <select
          className="guide-field mt-3"
          aria-label="Choose a category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {cats.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      )}
      <ol className="rank-list">
        {list.map((place, i) => (
          <li key={place.id}>
            <Link href={`/app/places/${place.slug}`}>
              <span className="rank-number">{String(place[key] ?? i + 1).padStart(2, "0")}</span>
              <span className="rank-name">
                <strong>{place.name.split(" (")[0]}</strong>
                <small>{place.barangay?.name || "Salcedo"}</small>
              </span>
              {Boolean(place.ratingCount) && (
                <span className="place-rating">
                  <Star size={13} fill="currentColor" />
                  {place.averageRating?.toFixed(1)}
                </span>
              )}
              <ChevronRight size={15} />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
