"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  BedDouble,
  Coffee,
  Flame,
  Landmark,
  LayoutGrid,
  Leaf,
  List,
  Map as MapIcon,
  Search,
  SlidersHorizontal,
  Star,
  UtensilsCrossed,
  Waves,
  X,
} from "lucide-react";
import { PlaceCard, type PlaceCardData } from "./PlaceCard";
import type { MapBarangayItem } from "./SalcedoMap";
import { trackSearchEvent } from "@/lib/client/analytics-tracker";

const SalcedoMap = dynamic(
  () => import("./SalcedoMap").then((m) => m.SalcedoMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[58vh] rounded-2xl border border-[#EAE7E0] bg-[#ECE9E0] flex items-center justify-center text-xs text-[#616E69]">
        Loading map...
      </div>
    ),
  }
);

type DirectorySort = "most_visited" | "top_rated" | "by_category" | "featured" | "name";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  publishedCount: number;
}

export function DiscoverDirectoryClient({
  initialPlaces,
  categories,
  barangays,
}: {
  initialPlaces: PlaceCardData[];
  categories: CategoryItem[];
  barangays: MapBarangayItem[];
}) {
  const searchParams = useSearchParams();
  return (
    <DiscoverDirectoryInner
      key={searchParams.toString()}
      initialPlaces={initialPlaces}
      categories={categories}
      barangays={barangays}
    />
  );
}

function DiscoverDirectoryInner({
  initialPlaces,
  categories,
  barangays,
}: {
  initialPlaces: PlaceCardData[];
  categories: CategoryItem[];
  barangays: MapBarangayItem[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialSortParam = searchParams.get("sort");
  const initialSort: DirectorySort =
    initialSortParam === "top_rated" ||
    initialSortParam === "by_category" ||
    initialSortParam === "featured" ||
    initialSortParam === "name" ||
    initialSortParam === "most_visited"
      ? initialSortParam
      : "most_visited";

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [selectedBarangay, setSelectedBarangay] = useState(
    searchParams.get("barangay") || "all"
  );
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "all");
  const [sortBy, setSortBy] = useState<DirectorySort>(initialSort);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const nonEmptyCategories = useMemo(
    () => categories.filter((c) => c.publishedCount > 0),
    [categories]
  );

  const availableTypes = useMemo(() => {
    const types = new Set(initialPlaces.map((p) => p.placeType));
    return Array.from(types);
  }, [initialPlaces]);

  const filteredPlaces = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = initialPlaces.filter((p) => {
      if (selectedCategory !== "all" && p.primaryCategory?.slug !== selectedCategory) {
        return false;
      }
      if (selectedBarangay !== "all" && p.barangay?.slug !== selectedBarangay) {
        return false;
      }
      if (selectedType !== "all") {
        if (selectedType === "attraction") {
          if (!["attraction", "nature", "heritage"].includes(p.placeType)) return false;
        } else if (p.placeType !== selectedType) {
          return false;
        }
      }
      if (q) {
        const hay = `${p.name} ${p.shortDescription} ${p.address} ${
          p.barangay?.name ?? ""
        } ${p.placeType}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === "most_visited") {
      return [...list].sort(
        (a, b) => (a.mostVisitedRank ?? 99) - (b.mostVisitedRank ?? 99)
      );
    }
    if (sortBy === "top_rated") {
      return [...list].sort(
        (a, b) => (a.topRatedRank ?? 99) - (b.topRatedRank ?? 99)
      );
    }
    if (sortBy === "by_category") {
      return [...list].sort(
        (a, b) => (a.categoryRank ?? 99) - (b.categoryRank ?? 99)
      );
    }
    if (sortBy === "name") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...list].sort(
      (a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured))
    );
  }, [initialPlaces, query, selectedCategory, selectedBarangay, selectedType, sortBy]);

  const categorizedGroups = useMemo(() => {
    if (sortBy !== "by_category") return [];
    const groups = new Map<
      string,
      { slug: string; name: string; places: PlaceCardData[] }
    >();

    for (const cat of nonEmptyCategories) {
      groups.set(cat.slug, { slug: cat.slug, name: cat.name, places: [] });
    }

    for (const p of filteredPlaces) {
      const slug = p.primaryCategory?.slug || p.placeType;
      const name = p.primaryCategory?.name || p.placeType;
      const group = groups.get(slug) ?? { slug, name, places: [] };
      group.places.push(p);
      groups.set(slug, group);
    }

    return Array.from(groups.values())
      .filter((g) => g.places.length > 0)
      .map((g) => ({
        ...g,
        places: [...g.places].sort(
          (a, b) => (a.categoryRank ?? 99) - (b.categoryRank ?? 99)
        ),
      }));
  }, [sortBy, filteredPlaces, nonEmptyCategories]);

  useEffect(() => {
    if (!query.trim()) return;
    const t = setTimeout(() => {
      void trackSearchEvent({
        query: query.trim(),
        categoryFilter: selectedCategory === "all" ? null : selectedCategory,
        barangayFilter: selectedBarangay === "all" ? null : selectedBarangay,
        resultsCount: filteredPlaces.length,
      });
    }, 600);
    return () => clearTimeout(t);
  }, [query, selectedCategory, selectedBarangay, filteredPlaces.length]);

  const clearFilters = () => {
    setQuery("");
    setSelectedCategory("all");
    setSelectedBarangay("all");
    setSelectedType("all");
    setSortBy("most_visited");
    router.replace("/app/discover");
  };

  const activeFilterCount =
    (selectedBarangay !== "all" ? 1 : 0) +
    (selectedType !== "all" ? 1 : 0) +
    (sortBy === "name" || sortBy === "featured" ? 1 : 0);

  const hasFilters =
    query.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedBarangay !== "all" ||
    selectedType !== "all";

  const selectedBarangayName = barangays.find((b) => b.slug === selectedBarangay)?.name;

  return (
    <div className="w-full min-w-0 space-y-3.5">
      {/* Sticky Native App Search, Ranking Tabs & Category Pills */}
      <div className="sticky top-0 z-30 w-full pt-2 pb-2.5 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#EAE7E0] space-y-2.5">
        <div className="px-4 flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-[#616E69] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search places, barangays..."
              className="w-full rounded-full border border-[#EAE7E0] bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#164237]/40"
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterSheetOpen(true)}
            aria-label="Open directory filters"
            className={`relative w-9 h-9 rounded-full border flex items-center justify-center shrink-0 active:scale-90 transition cursor-pointer ${
              activeFilterCount > 0
                ? "bg-[#164237] text-white border-[#164237]"
                : "bg-white text-[#1A2421] border-[#EAE7E0]"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1A2421] text-white text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setViewMode((v) => (v === "list" ? "map" : "list"))}
            aria-label={viewMode === "list" ? "Switch to map view" : "Switch to list view"}
            className="w-9 h-9 rounded-full border border-[#EAE7E0] bg-white flex items-center justify-center text-[#1A2421] shrink-0 active:scale-90 transition cursor-pointer"
          >
            {viewMode === "list" ? (
              <MapIcon className="w-4 h-4" />
            ) : (
              <List className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* “I’m in the mood for…” — one-tap browsing, no filter knowledge needed */}
        <div className="px-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-[#616E69] shrink-0">I want…</span>
          {([
            ["all", "Everything", Leaf],
            ["nature", "Falls & nature", Waves],
            ["resort", "Swim & relax", Waves],
            ["restaurant", "Eat", UtensilsCrossed],
            ["cafe", "Coffee", Coffee],
            ["heritage", "Heritage", Landmark],
            ["accommodation", "Stay overnight", BedDouble],
          ] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => { setSelectedType(value); setSelectedCategory("all"); }}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold border transition active:scale-95 cursor-pointer ${
                selectedType === value
                  ? "bg-[#164237] text-white border-[#164237]"
                  : "bg-white text-[#1A2421] border-[#EAE7E0]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Ranking Mode Segmented Bar */}
        <div className="px-4">
          <div className="grid grid-cols-3 rounded-full bg-[#EFECE5] p-0.5 border border-[#EAE7E0]">
            <button
              type="button"
              onClick={() => setSortBy("most_visited")}
              className={`rounded-full py-1.5 text-[11px] font-semibold inline-flex items-center justify-center gap-1 transition cursor-pointer ${
                sortBy === "most_visited"
                  ? "bg-white text-[#164237] shadow-2xs"
                  : "text-[#616E69]"
              }`}
            >
              <Flame className="w-3 h-3" />
              Popular
            </button>
            <button
              type="button"
              onClick={() => setSortBy("top_rated")}
              className={`rounded-full py-1.5 text-[11px] font-semibold inline-flex items-center justify-center gap-1 transition cursor-pointer ${
                sortBy === "top_rated"
                  ? "bg-white text-[#B88A44] shadow-2xs"
                  : "text-[#616E69]"
              }`}
            >
              <Star className="w-3 h-3" />
              Best Rated
            </button>
            <button
              type="button"
              onClick={() => setSortBy("by_category")}
              className={`rounded-full py-1.5 text-[11px] font-semibold inline-flex items-center justify-center gap-1 transition cursor-pointer ${
                sortBy === "by_category"
                  ? "bg-white text-[#1A2421] shadow-2xs"
                  : "text-[#616E69]"
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              By Category
            </button>
          </div>
        </div>

        {selectedCategory !== "all" && (
          <div className="px-4">
            <button type="button" onClick={() => setSelectedCategory("all")} className="inline-flex items-center gap-1 rounded-full bg-[#164237] text-white px-3 py-1 text-[11px] font-semibold cursor-pointer">
              {nonEmptyCategories.find((c) => c.slug === selectedCategory)?.name ?? "Category"} <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Results & Active Chips */}
      <div className="px-4 space-y-3.5">
      <p className="rounded-xl bg-[#164237]/5 border border-[#164237]/10 px-3 py-2 text-[11px] text-[#164237]">
        Tap a place to see it, or tap <strong>Add to Trip</strong> to put it straight into your plan. No account needed.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <p className="text-xs text-[#616E69]">
          <strong className="text-[#1A2421] tabular-nums">{filteredPlaces.length}</strong>{" "}
          {filteredPlaces.length === 1 ? "destination" : "destinations"}
          {sortBy === "most_visited"
            ? " • ranked by visits"
            : sortBy === "top_rated"
            ? " • ranked by tourist stars"
            : sortBy === "by_category"
            ? " • grouped by category"
            : ""}
        </p>

        {hasFilters && (
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedBarangayName && (
              <button
                type="button"
                onClick={() => setSelectedBarangay("all")}
                className="inline-flex items-center gap-1 rounded-full bg-[#F3F2EE] text-[#1A2421] px-2.5 py-0.5 text-[11px] font-medium cursor-pointer"
              >
                Brgy. {selectedBarangayName} <X className="w-3 h-3" />
              </button>
            )}
            {selectedType !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedType("all")}
                className="inline-flex items-center gap-1 rounded-full bg-[#F3F2EE] text-[#1A2421] px-2.5 py-0.5 text-[11px] font-medium capitalize cursor-pointer"
              >
                {selectedType} <X className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="text-[11px] font-semibold text-[#164237] cursor-pointer"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {viewMode === "map" ? (
        <SalcedoMap
          places={filteredPlaces}
          barangays={barangays}
          mode="embedded"
          heightClass="h-[56vh] min-h-[380px]"
        />
      ) : filteredPlaces.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EAE7E0] p-8 text-center space-y-3">
          <p className="font-display text-base font-bold text-[#1A2421]">
            No destinations match
          </p>
          <p className="text-xs text-[#616E69]">
            Clear your filters to browse all verified destinations in Salcedo.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full bg-[#164237] text-white px-5 py-2 text-xs font-semibold cursor-pointer"
          >
            Show All
          </button>
        </div>
      ) : sortBy === "by_category" ? (
        <div className="space-y-6">
          {categorizedGroups.map((group) => (
            <section key={group.slug} className="space-y-2.5">
              <div className="flex items-center justify-between px-0.5">
                <h2 className="font-display text-base font-bold text-[#1A2421]">
                  {group.name}
                </h2>
                <span className="text-[11px] font-semibold text-[#616E69] tabular-nums">
                  Top {group.places.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {group.places.map((place, idx) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    variant="row"
                    rankBadge={{ rank: place.categoryRank ?? idx + 1 }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredPlaces.map((place, idx) => (
            <PlaceCard
              key={place.id}
              place={place}
              variant="row"
              rankBadge={
                sortBy === "most_visited"
                  ? { rank: place.mostVisitedRank ?? idx + 1 }
                  : sortBy === "top_rated"
                  ? { rank: place.topRatedRank ?? idx + 1 }
                  : null
              }
            />
          ))}
        </div>
      )}
      </div>

      {/* Slide-Up Native Bottom Sheet Filter Drawer */}
      {filterSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="w-full max-w-[430px] bg-white rounded-t-[28px] border-t border-[#EAE7E0] p-5 pb-7 space-y-5 shadow-xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="w-10 h-1 rounded-full bg-[#D8D3C8] mx-auto -mt-1" />

            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[#1A2421]">Filters</h2>
              <button
                type="button"
                onClick={() => setFilterSheetOpen(false)}
                aria-label="Close filters"
                className="w-8 h-8 rounded-full bg-[#F3F2EE] flex items-center justify-center text-[#616E69] active:scale-90 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#616E69]">Barangay</label>
                <select
                  value={selectedBarangay}
                  onChange={(e) => setSelectedBarangay(e.target.value)}
                  className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-medium text-[#1A2421]"
                >
                  <option value="all">All 21 Barangays</option>
                  {barangays.map((b) => (
                    <option key={b.id} value={b.slug}>
                      Brgy. {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#616E69]">Place Type</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedType("all")}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border cursor-pointer ${
                      selectedType === "all"
                        ? "bg-[#164237] text-white border-[#164237]"
                        : "bg-[#FAF9F6] text-[#1A2421] border-[#EAE7E0]"
                    }`}
                  >
                    All
                  </button>
                  {availableTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize border cursor-pointer ${
                        selectedType === type
                          ? "bg-[#164237] text-white border-[#164237]"
                          : "bg-[#FAF9F6] text-[#1A2421] border-[#EAE7E0]"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#616E69]">Sort &amp; Rank</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSortBy("most_visited")}
                    className={`rounded-xl py-2.5 text-xs font-semibold border cursor-pointer ${
                      sortBy === "most_visited"
                        ? "bg-[#164237] text-white border-[#164237]"
                        : "bg-[#FAF9F6] text-[#1A2421] border-[#EAE7E0]"
                    }`}
                  >
                    Most Visited
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy("top_rated")}
                    className={`rounded-xl py-2.5 text-xs font-semibold border cursor-pointer ${
                      sortBy === "top_rated"
                        ? "bg-[#164237] text-white border-[#164237]"
                        : "bg-[#FAF9F6] text-[#1A2421] border-[#EAE7E0]"
                    }`}
                  >
                    Top Rated
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy("featured")}
                    className={`rounded-xl py-2.5 text-xs font-semibold border cursor-pointer ${
                      sortBy === "featured"
                        ? "bg-[#164237] text-white border-[#164237]"
                        : "bg-[#FAF9F6] text-[#1A2421] border-[#EAE7E0]"
                    }`}
                  >
                    Featured
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy("name")}
                    className={`rounded-xl py-2.5 text-xs font-semibold border cursor-pointer ${
                      sortBy === "name"
                        ? "bg-[#164237] text-white border-[#164237]"
                        : "bg-[#FAF9F6] text-[#1A2421] border-[#EAE7E0]"
                    }`}
                  >
                    Name (A–Z)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  clearFilters();
                  setFilterSheetOpen(false);
                }}
                className="flex-1 rounded-full border border-[#EAE7E0] py-2.5 text-xs font-semibold text-[#616E69] cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setFilterSheetOpen(false)}
                className="flex-[2] rounded-full bg-[#164237] text-white py-2.5 text-xs font-semibold active:scale-[0.98] transition cursor-pointer"
              >
                Show {filteredPlaces.length} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
