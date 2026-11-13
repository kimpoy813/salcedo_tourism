"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Eye, Flame, LayoutGrid, Star, Trophy } from "lucide-react";
import type { PlaceCardData } from "./PlaceCard";

type HomeRankTab = "most_visited" | "top_rated" | "by_category";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  publishedCount: number;
}

export function HomeRankingsCard({
  places,
  categories,
}: {
  places: PlaceCardData[];
  categories: CategoryItem[];
}) {
  const [tab, setTab] = useState<HomeRankTab>("most_visited");

  const nonEmptyCategories = useMemo(
    () => categories.filter((c) => c.publishedCount > 0),
    [categories]
  );

  const [selectedCatSlug, setSelectedCatSlug] = useState<string>(
    nonEmptyCategories[0]?.slug || "nature-waterfalls"
  );

  const topList = useMemo(() => {
    if (tab === "most_visited") {
      return [...places]
        .sort((a, b) => (a.mostVisitedRank ?? 99) - (b.mostVisitedRank ?? 99))
        .slice(0, 5);
    }
    if (tab === "top_rated") {
      return [...places]
        .sort((a, b) => (a.topRatedRank ?? 99) - (b.topRatedRank ?? 99))
        .slice(0, 5);
    }
    return places
      .filter((p) => p.primaryCategory?.slug === selectedCatSlug)
      .sort((a, b) => (a.categoryRank ?? 99) - (b.categoryRank ?? 99))
      .slice(0, 5);
  }, [places, tab, selectedCatSlug]);

  const discoverHref =
    tab === "by_category"
      ? `/app/discover?sort=by_category&category=${encodeURIComponent(selectedCatSlug)}`
      : `/app/discover?sort=${tab}`;

  return (
    <section className="w-full min-w-0 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-[#1A2421] inline-flex items-center gap-1.5 min-w-0">
          <Trophy className="w-4 h-4 text-[#B88A44] shrink-0" />
          <span className="truncate">Top Ranked Spots</span>
        </h2>
        <Link
          href={discoverHref}
          className="text-xs font-semibold text-[#164237] inline-flex items-center gap-0.5 shrink-0"
        >
          See all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Mode Switcher */}
      <div className="w-full grid grid-cols-3 rounded-full bg-[#EFECE5] p-1 border border-[#EAE7E0]">
        <button
          type="button"
          onClick={() => setTab("most_visited")}
          className={`rounded-full py-1.5 text-[11px] font-semibold inline-flex items-center justify-center gap-1 transition cursor-pointer ${
            tab === "most_visited"
              ? "bg-white text-[#164237] shadow-2xs"
              : "text-[#616E69]"
          }`}
        >
          <Flame className="w-3 h-3 shrink-0" />
          <span>Most Visited</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("top_rated")}
          className={`rounded-full py-1.5 text-[11px] font-semibold inline-flex items-center justify-center gap-1 transition cursor-pointer ${
            tab === "top_rated"
              ? "bg-white text-[#B88A44] shadow-2xs"
              : "text-[#616E69]"
          }`}
        >
          <Star className="w-3 h-3 shrink-0" />
          <span>Top Rated</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("by_category")}
          className={`rounded-full py-1.5 text-[11px] font-semibold inline-flex items-center justify-center gap-1 transition cursor-pointer ${
            tab === "by_category"
              ? "bg-white text-[#1A2421] shadow-2xs"
              : "text-[#616E69]"
          }`}
        >
          <LayoutGrid className="w-3 h-3 shrink-0" />
          <span>Category</span>
        </button>
      </div>

      {/* Category Chips when By Category is active */}
      {tab === "by_category" && (
        <div className="w-full flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {nonEmptyCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCatSlug(c.slug)}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition cursor-pointer ${
                selectedCatSlug === c.slug
                  ? "bg-[#164237] text-white"
                  : "bg-white border border-[#EAE7E0] text-[#1A2421]"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Clean Leaderboard Card */}
      <div className="w-full bg-white rounded-2xl border border-[#EAE7E0] divide-y divide-[#EAE7E0] overflow-hidden">
        {topList.map((p, idx) => {
          const rank =
            tab === "most_visited"
              ? p.mostVisitedRank ?? idx + 1
              : tab === "top_rated"
              ? p.topRatedRank ?? idx + 1
              : p.categoryRank ?? idx + 1;
          return (
            <Link
              key={p.id}
              href={`/app/places/${p.slug}`}
              className="flex items-center gap-3 p-3 active:bg-[#FAF9F6] transition"
            >
              <span
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 tabular-nums ${
                  rank === 1
                    ? "bg-[#B88A44] text-white"
                    : rank === 2
                    ? "bg-[#164237] text-white"
                    : rank === 3
                    ? "bg-[#1D7874] text-white"
                    : "bg-[#F3F2EE] text-[#1A2421]"
                }`}
              >
                #{rank}
              </span>

              <img
                src={p.featuredImageUrl || "/images/salcedo/hero-salcedo-valley.png"}
                alt={p.name}
                className="w-11 h-11 rounded-xl object-cover shrink-0 bg-[#F3F2EE]"
              />

              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-xs text-[#1A2421] truncate">
                  {p.name}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-[#616E69] mt-0.5">
                  <span className="truncate">
                    {p.barangay ? `Brgy. ${p.barangay.name}` : p.primaryCategory?.name}
                  </span>
                  {(p.ratingCount ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-0.5 font-semibold text-[#1A2421] shrink-0 tabular-nums">
                      <Star className="w-2.5 h-2.5 text-[#B88A44]" fill="currentColor" />
                      {p.averageRating?.toFixed(1)} ({p.ratingCount})
                    </span>
                  )}
                  {(p.visitCount ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-0.5 shrink-0 tabular-nums">
                      <Eye className="w-2.5 h-2.5" />
                      {p.visitCount}
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-[#616E69]/70 shrink-0" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
