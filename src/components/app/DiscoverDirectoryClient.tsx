"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  List,
  Map as MapIcon,
  Search,
  SlidersHorizontal,
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
      <div className="h-[58vh] rounded-2xl border border-[#E5E0D5] bg-white flex items-center justify-center text-xs text-[#5A6B66]">
        Loading interactive Salcedo map...
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

  // Debounced anonymous search logging
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
      {/* Sticky Mobile Search & View Switcher */}
      <div className="sticky top-14 z-30 -mx-4 px-4 pt-1 pb-2.5 bg-[#F8F7F2]/95 backdrop-blur-md border-b border-[#E5E0D5]/80 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-[#5A6B66] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search spots, barangays, food..."
              className="w-full rounded-xl border border-[#E5E0D5] bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#123F35]/20"
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterSheetOpen(true)}
            aria-label="Open directory filters"
            className={`relative inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold shrink-0 cursor-pointer transition ${
              activeFilterCount > 0
                ? "bg-[#123F35] text-white border-[#123F35]"
                : "bg-white text-[#202B28] border-[#E5E0D5]"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#D6A85B] text-[#0D3029] text-[10px] font-extrabold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setViewMode((v) => (v === "list" ? "map" : "list"))}
            aria-label={viewMode === "list" ? "Switch to map view" : "Switch to list view"}
            className="inline-flex items-center gap-1 rounded-xl border border-[#E5E0D5] bg-white px-3 py-2 text-xs font-bold text-[#123F35] shrink-0 cursor-pointer"
          >
            {viewMode === "list" ? (
              <>
                <MapIcon className="w-4 h-4" />
                <span>Map</span>
              </>
            ) : (
              <>
                <List className="w-4 h-4" />
                <span>List</span>
              </>
            )}
          </button>
        </div>

        {/* Horizontal Scrollable Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSelectedType("all");
            }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
              selectedCategory === "all" && selectedType === "all"
                ? "bg-[#123F35] text-white"
                : "bg-white text-[#202B28] border border-[#E5E0D5]"
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
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                selectedCategory === cat.slug
                  ? "bg-[#123F35] text-white"
                  : "bg-white text-[#202B28] border border-[#E5E0D5]"
              }`}
            >
              {cat.name} ({cat.publishedCount})
            </button>
          ))}
        </div>
      </div>

      {/* Active Filter Chips & Result Count */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <p className="text-xs text-[#5A6B66]">
          <strong className="text-[#202B28] tabular-nums">{filteredPlaces.length}</strong>{" "}
          verified {filteredPlaces.length === 1 ? "destination" : "destinations"}
        </p>

        {hasFilters && (
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedBarangayName && (
              <button
                type="button"
                onClick={() => setSelectedBarangay("all")}
                className="inline-flex items-center gap-1 rounded-full bg-[#168A8A]/12 text-[#168A8A] px-2.5 py-0.5 text-[11px] font-bold cursor-pointer"
              >
                Brgy. {selectedBarangayName} <X className="w-3 h-3" />
              </button>
            )}
            {selectedType !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedType("all")}
                className="inline-flex items-center gap-1 rounded-full bg-[#123F35]/10 text-[#123F35] px-2.5 py-0.5 text-[11px] font-bold capitalize cursor-pointer"
              >
                {selectedType} <X className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="text-[11px] font-bold text-rose-700 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Directory Content */}
      {viewMode === "map" ? (
        <SalcedoMap
          places={filteredPlaces}
          barangays={barangays}
          heightClass="h-[56vh] min-h-[380px]"
        />
      ) : filteredPlaces.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E0D5] p-8 text-center space-y-3">
          <p className="font-display text-base font-bold text-[#202B28]">
            No matching spots found
          </p>
          <p className="text-xs text-[#5A6B66]">
            Try resetting filters or searching another Salcedo barangay or destination.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl bg-[#123F35] text-white px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPlaces.map((place) => (
            <PlaceCard key={place.id} place={place} variant="row" />
          ))}
        </div>
      )}

      {/* Slide-Up Mobile Filter Bottom Sheet */}
      {filterSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-[1px]">
          <div className="w-full max-w-[440px] bg-white rounded-t-3xl border-t border-[#E5E0D5] p-5 pb-7 space-y-5 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="font-display text-lg font-bold text-[#202B28]">
                  Filter Destinations
                </h2>
                <p className="text-xs text-[#5A6B66]">
                  Narrow down across all 21 Salcedo barangays
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFilterSheetOpen(false)}
                aria-label="Close filter drawer"
                className="w-8 h-8 rounded-full bg-[#F8F7F2] flex items-center justify-center text-[#5A6B66] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#202B28]">Barangay</label>
                <select
                  value={selectedBarangay}
                  onChange={(e) => setSelectedBarangay(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3.5 py-2.5 text-sm font-medium text-[#202B28]"
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
                <label className="text-xs font-bold text-[#202B28]">Place Type</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedType("all")}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold border cursor-pointer ${
                      selectedType === "all"
                        ? "bg-[#123F35] text-white border-[#123F35]"
                        : "bg-[#F8F7F2] text-[#202B28] border-[#E5E0D5]"
                    }`}
                  >
                    All Types
                  </button>
                  {availableTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize border cursor-pointer ${
                        selectedType === type
                          ? "bg-[#123F35] text-white border-[#123F35]"
                          : "bg-[#F8F7F2] text-[#202B28] border-[#E5E0D5]"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#202B28]">Sort Order</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSortBy("featured")}
                    className={`rounded-xl py-2.5 text-xs font-bold border cursor-pointer ${
                      sortBy === "featured"
                        ? "bg-[#123F35] text-white border-[#123F35]"
                        : "bg-[#F8F7F2] text-[#202B28] border-[#E5E0D5]"
                    }`}
                  >
                    Featured First
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy("name")}
                    className={`rounded-xl py-2.5 text-xs font-bold border cursor-pointer ${
                      sortBy === "name"
                        ? "bg-[#123F35] text-white border-[#123F35]"
                        : "bg-[#F8F7F2] text-[#202B28] border-[#E5E0D5]"
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
                className="flex-1 rounded-xl border border-[#E5E0D5] py-3 text-xs font-bold text-[#5A6B66] cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setFilterSheetOpen(false)}
                className="flex-[2] rounded-xl bg-[#123F35] text-white py-3 text-xs font-bold cursor-pointer"
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
