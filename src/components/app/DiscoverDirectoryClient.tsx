"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { List, Map as MapIcon, Search, SlidersHorizontal, X } from "lucide-react";
import { PlaceCard, type PlaceCardData } from "./PlaceCard";
import type { MapBarangayItem } from "./SalcedoMap";
import { trackSearchEvent } from "@/lib/client/analytics-tracker";

const SalcedoMap = dynamic(
  () => import("./SalcedoMap").then((m) => m.SalcedoMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[58vh] rounded-2xl border border-[#EAE7E0] bg-[#EAE6DC] flex items-center justify-center text-xs text-[#616E69]">
        Loading map...
      </div>
    ),
  }
);

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

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [selectedBarangay, setSelectedBarangay] = useState(
    searchParams.get("barangay") || "all"
  );
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "all");
  const [sortBy, setSortBy] = useState<"featured" | "name">("featured");
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

    if (sortBy === "name") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...list].sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)));
  }, [initialPlaces, query, selectedCategory, selectedBarangay, selectedType, sortBy]);

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
    setSortBy("featured");
    router.replace("/app/discover");
  };

  const activeFilterCount =
    (selectedBarangay !== "all" ? 1 : 0) +
    (selectedType !== "all" ? 1 : 0) +
    (sortBy !== "featured" ? 1 : 0);

  const hasFilters =
    query.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedBarangay !== "all" ||
    selectedType !== "all";

  const selectedBarangayName = barangays.find((b) => b.slug === selectedBarangay)?.name;

  return (
    <div className="space-y-3.5">
      {/* Sticky Native App Search & Segmented Bar */}
      <div className="sticky top-0 z-30 -mx-4 px-4 pt-2 pb-2.5 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#EAE7E0] space-y-2.5">
        <div className="flex items-center gap-2">
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

        {/* Clean Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSelectedType("all");
            }}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition active:scale-95 cursor-pointer ${
              selectedCategory === "all" && selectedType === "all"
                ? "bg-[#164237] text-white"
                : "bg-white text-[#1A2421] border border-[#EAE7E0]"
            }`}
          >
            All ({initialPlaces.length})
          </button>

          {nonEmptyCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.slug);
                setSelectedType("all");
              }}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition active:scale-95 cursor-pointer ${
                selectedCategory === cat.slug
                  ? "bg-[#164237] text-white"
                  : "bg-white text-[#1A2421] border border-[#EAE7E0]"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results & Active Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <p className="text-xs text-[#616E69]">
          <strong className="text-[#1A2421] tabular-nums">{filteredPlaces.length}</strong>{" "}
          {filteredPlaces.length === 1 ? "destination" : "destinations"}
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
      ) : (
        <div className="space-y-2.5">
          {filteredPlaces.map((place) => (
            <PlaceCard key={place.id} place={place} variant="row" />
          ))}
        </div>
      )}

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
                <label className="text-xs font-semibold text-[#616E69]">Sort</label>
                <div className="grid grid-cols-2 gap-2">
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
