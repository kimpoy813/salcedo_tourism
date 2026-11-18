"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BrowserAtlas } from "./BrowserAtlas";
import {
  Check,
  Coffee,
  Grid2X2,
  Landmark,
  LayoutGrid,
  Map as MapIcon,
  Mountain,
  Search,
  SlidersHorizontal,
  Waves,
  X,
} from "lucide-react";
import { interests, typeLabels, selectDirectoryPlaces } from "@/lib/guide-interests";
import { Modal } from "@/components/ui/Modal";
import { Kicker } from "@/components/ui/FieldGuide";
import { PlaceCard, type PlaceCardData } from "./PlaceCard";
import type { MapBarangayItem } from "@/lib/geo/atlas";
import { trackSearchEvent } from "@/lib/client/analytics-tracker";

const sortModes = [
  ["most_visited", "Most visited"],
  ["top_rated", "Top rated"],
  ["by_category", "By category"],
  ["featured", "Featured first"],
  ["name", "Name (A–Z)"],
];
const icons = [Mountain, Waves, Coffee, Landmark];
interface Category {
  id: string;
  name: string;
  slug: string;
  publishedCount: number;
}

// Update the shareable view without a network request or losing input focus.
function changeView(values: Record<string, string>, reset = false) {
  const url = new URL(window.location.href);
  if (reset) url.search = "";
  for (const [key, value] of Object.entries(values)) {
    if (value && (key === "q" || value !== "all")) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

export function DiscoverDirectoryClient({
  initialPlaces,
  categories,
  barangays,
}: {
  initialPlaces: PlaceCardData[];
  categories: Category[];
  barangays: MapBarangayItem[];
}) {
  const params = useSearchParams();
  const query = params.get("q") || "";
  const category = params.get("category") || "all";
  const barangay = params.get("barangay") || "all";
  const type = params.get("type") || "all";
  const interest = interests.find((i) => i.key === params.get("interest"));
  const sort = sortModes.some(([key]) => key === params.get("sort"))
    ? params.get("sort")
    : "most_visited";
  const isMap = params.get("view") === "map";
  const [filtersOpen, setFiltersOpen] = useState(false);
  const availableTypes = [...new Set(initialPlaces.map((p) => p.placeType))].sort();

  const places = useMemo(
    () => selectDirectoryPlaces(initialPlaces, { interest, category, barangay, type, query, sort }),
    [initialPlaces, interest, category, barangay, type, query, sort],
  );

  useEffect(() => {
    if (!query.trim()) return;
    const timer = setTimeout(() => {
      void trackSearchEvent({
        query: query.trim(),
        categoryFilter: category === "all" ? null : category,
        barangayFilter: barangay === "all" ? null : barangay,
        resultsCount: places.length,
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [query, category, barangay, places.length]);

  const groups = new Map<string, PlaceCardData[]>();
  for (const place of places) {
    const name =
      sort === "by_category"
        ? place.primaryCategory?.name || typeLabels[place.placeType] || "More places"
        : "";
    const group = groups.get(name) ?? [];
    group.push(place);
    groups.set(name, group);
  }
  const chips = [
    [
      "category",
      category === "all" ? "" : categories.find((c) => c.slug === category)?.name || category,
    ],
    [
      "barangay",
      barangay === "all"
        ? ""
        : `Brgy. ${barangays.find((b) => b.slug === barangay)?.name || barangay}`,
    ],
    ["type", type === "all" ? "" : typeLabels[type] || type],
  ].filter(([, label]) => label);
  const clear = () => changeView({ view: isMap ? "map" : "" }, true);
  return (
    <div className="directory">
      <div className="directory-tools">
        <div className="search-row">
          <label className="directory-search">
            <Search size={18} />
            <input
              aria-label="Search places and barangays"
              type="search"
              value={query}
              onChange={(e) => changeView({ q: e.target.value })}
              placeholder="Search places, activities, or barangays…"
            />
          </label>
          <button type="button" className="secondary-button" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal size={16} />
            Filters{chips.length > 0 && <b>{chips.length}</b>}
          </button>
          <div className="view-toggle" aria-label="Directory view">
            <button
              aria-pressed={!isMap}
              aria-label="Grid view"
              onClick={() => changeView({ view: "" })}
            >
              <Grid2X2 size={16} />
              <span>Grid</span>
            </button>
            <button
              aria-pressed={isMap}
              aria-label="Map view"
              onClick={() => changeView({ view: "map" })}
            >
              <MapIcon size={16} />
              <span>Map</span>
            </button>
          </div>
        </div>
        <div className="interest-filters" aria-label="Filter by interest">
          <button
            aria-pressed={!interest && type === "all" && category === "all"}
            onClick={() => changeView({ interest: "", type: "", category: "" })}
          >
            <LayoutGrid size={14} />
            All places
          </button>
          {interests.map((item, i) => {
            const Icon = icons[i];
            return (
              <button
                key={item.key}
                aria-pressed={interest?.key === item.key}
                onClick={() =>
                  changeView({
                    interest: interest?.key === item.key ? "" : item.key,
                    type: "",
                    category: "",
                  })
                }
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="result-toolbar">
        <p role="status">
          <strong>{places.length}</strong> {places.length === 1 ? "place" : "places"}
          {query.trim() ? (
            <> for “{query.trim()}”</>
          ) : interest ? (
            ` in ${interest.label.toLowerCase()}`
          ) : (
            " to explore"
          )}
        </p>
        <label>
          Sort by{" "}
          <select
            aria-label="Sort destinations"
            value={sort || "most_visited"}
            onChange={(e) => changeView({ sort: e.target.value })}
          >
            {sortModes.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {chips.length > 0 && (
        <div className="applied-filters">
          {chips.map(([key, label]) => (
            <button
              key={key}
              onClick={() => changeView({ [key]: "" })}
              aria-label={`Remove ${label} filter`}
            >
              {label}
              <X size={13} />
            </button>
          ))}
          <button onClick={clear}>Clear all</button>
        </div>
      )}
      {!places.length ? (
        <div className="directory-empty">
          <Search size={29} />
          <h2>No places found</h2>
          <p>Try another search or clear your filters to see the full directory.</p>
          <button className="primary-button" onClick={clear}>
            Show all places
          </button>
        </div>
      ) : isMap ? (
        <BrowserAtlas
          places={places}
          barangays={barangays}
          mode="embedded"
          key={places.map((p) => p.id).sort().join(",")}
        />
      ) : (
        Array.from(groups, ([name, group]) => (
          <section key={name} className="directory-group">
            {name && <h2>{name}</h2>}
            <div className="places-grid">
              {group.map((p) => (
                <PlaceCard key={p.id} place={p} />
              ))}
            </div>
          </section>
        ))
      )}
      {filtersOpen && (
        <Modal label="Filter destinations" onClose={() => setFiltersOpen(false)}>
          <form
            className="filter-form"
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              changeView({
                barangay: String(form.get("barangay")),
                category: String(form.get("category")),
                type: String(form.get("type")),
              });
              setFiltersOpen(false);
            }}
          >
            <div className="dialog-heading">
              <div>
                <Kicker>Place directory</Kicker>
                <h2>Refine your search</h2>
              </div>
              <button
                type="button"
                aria-label="Close filters"
                className="icon-button"
                onClick={() => setFiltersOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="filter-field">
              <label htmlFor="filter-barangay">Barangay</label>
              <select
                id="filter-barangay"
                name="barangay"
                className="guide-field"
                defaultValue={barangay}
              >
                <option value="all">All barangays</option>
                {barangays.map((b) => (
                  <option key={b.id} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label htmlFor="filter-category">Category</label>
              <select
                id="filter-category"
                name="category"
                className="guide-field"
                defaultValue={category}
              >
                <option value="all">All categories</option>
                {categories
                  .filter((c) => c.publishedCount > 0)
                  .map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="filter-field">
              <label htmlFor="filter-type">Place type</label>
              <select id="filter-type" name="type" className="guide-field" defaultValue={type}>
                <option value="all">All place types</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t}>
                    {t === "attraction" ? "All attractions" : typeLabels[t] || t}
                  </option>
                ))}
              </select>
            </div>
            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  clear();
                  setFiltersOpen(false);
                }}
              >
                Clear all
              </button>
              <button type="submit" className="primary-button">
                <Check size={16} />
                Apply filters
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
