"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Filter, List, Map as MapIcon, Search, X } from "lucide-react";
import { PlaceCard, type PlaceCardData } from "./PlaceCard";
import type { MapBarangayItem } from "./SalcedoMap";
import { trackSearchEvent } from "@/lib/client/analytics-tracker";

const SalcedoMap = dynamic(
  () => import("./SalcedoMap").then((m) => m.SalcedoMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[60vh] rounded-2xl border border-[#E5E0D5] bg-white flex items-center justify-center text-sm text-[#5A6B66]">
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
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

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
    router.replace("/app/discover");
  };

  const hasFilters =
    query.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedBarangay !== "all" ||
    selectedType !== "all";

  return (
    <div className="space-y-6">
      {/* Search & Controls Header */}
      <div className="bg-white rounded-3xl border border-[#E5E0D5] p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5A6B66] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Salcedo waterfalls, resorts, barangays, food..."
              className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#123F35]/25"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              aria-label="Filter by Barangay"
              className="rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2.5 text-xs sm:text-sm font-medium text-[#202B28]"
            >
              <option value="all">All 21 Barangays</option>
              {barangays.map((b) => (
                <option key={b.id} value={b.slug}>
                  Brgy. {b.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "featured" | "name")}
              aria-label="Sort results"
              className="rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2.5 text-xs sm:text-sm font-medium text-[#202B28]"
            >
              <option value="featured">Sort: Featured</option>
              <option value="name">Sort: Name A–Z</option>
            </select>

            <div className="inline-flex rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[#123F35] text-white"
                    : "text-[#5A6B66] hover:text-[#202B28]"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  viewMode === "map"
                    ? "bg-[#123F35] text-white"
                    : "text-[#5A6B66] hover:text-[#202B28]"
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Map
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills (Non-empty categories only) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#5A6B66] mr-1">
            <Filter className="w-3.5 h-3.5" /> Categories:
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSelectedType("all");
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
              selectedCategory === "all" && selectedType === "all"
                ? "bg-[#123F35] text-white"
                : "bg-[#F8F7F2] text-[#202B28] border border-[#E5E0D5]"
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
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                selectedCategory === cat.slug
                  ? "bg-[#123F35] text-white"
                  : "bg-[#F8F7F2] text-[#202B28] border border-[#E5E0D5] hover:border-[#123F35]/40"
              }`}
            >
              {cat.name} ({cat.publishedCount})
            </button>
          ))}

          {availableTypes.includes("resort") && (
            <button
              type="button"
              onClick={() => {
                setSelectedType("resort");
                setSelectedCategory("all");
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                selectedType === "resort"
                  ? "bg-[#168A8A] text-white"
                  : "bg-[#F8F7F2] text-[#202B28] border border-[#E5E0D5]"
              }`}
            >
              Resorts Only
            </button>
          )}

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 cursor-pointer"
            >
              <X className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-[#5A6B66]">
          Showing <strong className="text-[#202B28] tabular-nums">{filteredPlaces.length}</strong>{" "}
          verified Salcedo {filteredPlaces.length === 1 ? "destination" : "destinations"}
        </p>
      </div>

      {/* Directory Content */}
      {viewMode === "map" ? (
        <SalcedoMap places={filteredPlaces} barangays={barangays} />
      ) : filteredPlaces.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E5E0D5] p-10 text-center space-y-3">
          <p className="font-display text-lg font-bold text-[#202B28]">
            No matching destinations found
          </p>
          <p className="text-sm text-[#5A6B66] max-w-md mx-auto">
            Try clearing your filters or searching another Salcedo barangay, waterfall, resort, or
            local product.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl bg-[#123F35] text-white px-5 py-2.5 text-sm font-bold cursor-pointer"
          >
            Show All Verified Destinations
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlaces.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </div>
  );
}
