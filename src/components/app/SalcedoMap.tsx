"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import "./atlas/atlas.css";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  Compass,
  List,
  MapPin,
  Route,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { typeLabels } from "@/lib/guide-interests";
import {
  ANYWHERE,
  indexFieldLines,
  isMapped,
  selectPins,
  type MapBarangayItem,
  type MapFilters,
  type MapHit,
  type MappedPlace,
  type MapScope,
  type MapSort,
} from "@/lib/geo/atlas";
import {
  SALCEDO_BARANGAY_POLYGONS,
  type LatLngTuple,
} from "@/lib/geo/salcedo-boundary";
import { AtlasCanvas, type CameraTarget } from "./atlas/AtlasCanvas";
import { AtlasSearch } from "./atlas/AtlasSearch";
import { PlaceIndex, PlacePreview } from "./atlas/PlaceIndex";
import { useTelemetry, useFieldData, useOnline } from "./atlas/useAtlasData";
import type { PlaceCardData } from "./PlaceCard";
import { useMobileApp } from "./MobileAppContext";

const filterTypeName = (t: string) =>
  t === "nature" ? "Nature & attractions" : typeLabels[t] || t;
const SCOPES = [
  { id: "all", label: "All places", Icon: Compass },
  { id: "saved", label: "Saved", Icon: Bookmark },
  { id: "trip", label: "My trip", Icon: Route },
] as const;
const EMPTY = { id: null, landmark: null, camera: null };
type Focus = {
  id: string | null;
  landmark: MapHit | null;
  camera: CameraTarget | null;
};
const point = (p: { latitude: number; longitude: number }): CameraTarget => ({
  point: [p.latitude, p.longitude],
});
function count(n: number) {
  return `${n} ${n === 1 ? "place" : "places"}`;
}

export function SalcedoMap({
  places,
  barangays,
  mode = "embedded",
  initialPlaceSlug,
}: {
  places: PlaceCardData[];
  barangays: MapBarangayItem[];
  mode?: "fullscreen" | "embedded";
  initialPlaceSlug?: string;
}) {
  const compact = mode === "embedded",
    mapped = useMemo(() => places.filter(isMapped), [places]);
  const [focus, setFocus] = useState<Focus>(() => {
    const p = mapped.find((p) => p.slug === initialPlaceSlug);
    return p ? { ...EMPTY, id: p.id, camera: point(p) } : EMPTY;
  });
  const [filters, setFilters] = useState<MapFilters>(ANYWHERE),
    [scope, setScope] = useState<MapScope>("all"),
    [sort, setSort] = useState<MapSort>("most_visited");
  const [filterOpen, setFilterOpen] = useState(false),
    [listOpen, setListOpen] = useState(false),
    [stack, setStack] = useState<MappedPlace[] | null>(null);
  const { draftStopIds, savedPlaceIds, showToast } = useMobileApp(),
    online = useOnline(),
    field = useFieldData();
  useEffect(() => {
    if (initialPlaceSlug && !mapped.some((p) => p.slug === initialPlaceSlug))
      showToast("This place is not on the map. Showing the available places.", {
        tone: "info",
      });
  }, [initialPlaceSlug, mapped, showToast]);
  const lines = useMemo(
    () => (field.data ? indexFieldLines(field.data) : []),
    [field.data],
  );
  const scopeIds =
    scope === "trip"
      ? draftStopIds
      : scope === "saved"
        ? savedPlaceIds
        : undefined;
  const scoped = useMemo(
    () => (scopeIds ? new Set(scopeIds) : undefined),
    [scopeIds],
  );
  const pins = useMemo(
    () => (compact ? mapped : selectPins(mapped, filters, scoped)),
    [mapped, filters, scoped, compact],
  );
  const index = useMemo(
    () =>
      compact || sort === "most_visited"
        ? pins
        : selectPins(pins, ANYWHERE, undefined, sort),
    [compact, sort, pins],
  );
  const areaName = barangays.find((b) => b.slug === filters.area)?.name;
  const availableTypes = useMemo(
    () =>
      [
        ...new Set(
          mapped.map((p) =>
            p.placeType === "attraction" ? "nature" : p.placeType,
          ),
        ),
      ].sort((a, b) => (typeLabels[a] || a).localeCompare(typeLabels[b] || b)),
    [mapped],
  );
  const selected = pins.find((p) => p.id === focus.id),
    { weather, elevation } = useTelemetry(online, !compact, selected);
  const filtered = !!(filters.area || filters.type || scope !== "all");
  const overview = useMemo(
    () => ({
      // Reordering the index alone should not change an explored viewport.
      autoKey:
        filters.area +
        ":" +
        pins
          .map((p) => `${p.latitude},${p.longitude}`)
          .sort()
          .join(";"),
      points: [
        ...(SALCEDO_BARANGAY_POLYGONS.find((b) => b.slug === filters.area)
          ?.coordinates || []),
        ...pins.map((p) => [p.latitude, p.longitude] as LatLngTuple),
      ],
    }),
    [filters.area, pins],
  );
  const camera =
    focus.camera && (!focus.id || selected) ? focus.camera : overview;
  function select(p: MappedPlace) {
    setFocus({ id: p.id, landmark: null, camera: point(p) });
    setListOpen(false);
    setStack(null);
  }
  function fit() {
    setFocus({ ...EMPTY, camera: { points: overview.points } });
  }
  function reset() {
    setFilters(ANYWHERE);
    setScope("all");
    setFocus(EMPTY);
  }
  function changeArea(area: string) {
    setFilters((f) => ({ ...f, area }));
    setFocus(EMPTY);
  }
  function chooseHit(h: MapHit) {
    if (h.kind === "place") {
      const p = mapped.find((p) => p.slug === h.slug);
      if (p) {
        if (!pins.some((pin) => pin.id === p.id)) reset();
        select(p);
      }
      return;
    }
    reset();
    if (h.kind === "barangay" && h.slug) {
      setFilters({ ...ANYWHERE, area: h.slug });
      return;
    }
    setFocus({ id: null, landmark: h, camera: point(h) });
  }
  const empty = (
    <div className="atlas-no-pins">
      <MapPin size={24} />
      <h3>
        {scope === "saved"
          ? "No saved pins here"
          : scope === "trip"
            ? "No trip stops here"
            : "No places on this map"}
      </h3>
      <p>
        {filtered
          ? "Change your filters to explore more of Salcedo."
          : "No matching directory places have mapped coordinates in Salcedo."}
      </p>
      {filtered && (
        <button type="button" className="secondary-button" onClick={reset}>
          Show all places
        </button>
      )}
    </div>
  );
  const sortSelect = (
    <label className="atlas-sort">
      <select
        aria-label="Sort map places"
        value={sort}
        onChange={(e) => setSort(e.target.value as MapSort)}
      >
        <option value="most_visited">Most visited</option>
        <option value="top_rated">Top rated</option>
        <option value="by_category">By category</option>
      </select>
    </label>
  );
  const tags = (
    <div className="atlas-filter-tags">
      {scope !== "all" && (
        <button
          aria-label={`Remove collection filter: ${scope === "trip" ? "My trip" : "Saved"}`}
          onClick={() => {
            setScope("all");
            setFocus(EMPTY);
          }}
        >
          {scope === "trip" ? "My trip" : "Saved"}
          <X size={12} />
        </button>
      )}
      {filters.area && (
        <button
          aria-label={`Remove barangay filter: ${areaName}`}
          onClick={() => changeArea("")}
        >
          {areaName}
          <X size={12} />
        </button>
      )}
      {filters.type && (
        <button
          aria-label={`Remove type filter: ${filterTypeName(filters.type)}`}
          onClick={() => {
            setFilters((f) => ({ ...f, type: "" }));
            setFocus(EMPTY);
          }}
        >
          {filterTypeName(filters.type)}
          <X size={12} />
        </button>
      )}
    </div>
  );
  function browse() {
    setStack(null);
    setListOpen(true);
  }
  const canvas = (
    <AtlasCanvas
      pins={pins}
      selected={selected}
      areas={barangays}
      area={filters.area}
      onArea={changeArea}
      onPlace={select}
      onStack={(members, openIndex) => {
        setFocus((f) => ({ ...f, id: null, landmark: null }));
        if (openIndex) {
          setStack(members);
          setListOpen(true);
        }
      }}
      onFit={fit}
      onLocate={(pos) =>
        setFocus({ ...EMPTY, camera: { point: pos, lift: false } })
      }
      camera={camera}
      landmark={focus.landmark}
      fieldData={field.data}
      fieldLines={lines}
      fieldFailed={field.failed}
      retry={field.retry}
      online={online}
      compact={compact}
      weather={weather}
    >
      {selected || focus.landmark ? (
        <PlacePreview
          place={selected}
          landmark={focus.landmark}
          elevation={elevation}
          onClose={() => setFocus((f) => ({ ...f, id: null, landmark: null }))}
        />
      ) : !pins.length ? (
        <div className="atlas-empty-overlay">{empty}</div>
      ) : !compact ? (
        <button className="atlas-browse" onClick={browse}>
          <List size={16} />
          Browse {count(pins.length)}
        </button>
      ) : null}
    </AtlasCanvas>
  );
  return (
    <>
      {compact ? (
        <section className="atlas-embed" aria-label="Directory map">
          <div className="atlas-embed-head">
            <span>
              <Compass size={17} />
              <strong>Directory map</strong>
              <small>{pins.length} mapped</small>
            </span>
            <div className="atlas-embed-actions">
              {!!pins.length && (
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-label="Place index"
                  onClick={browse}
                >
                  <List size={14} />
                  Index
                </button>
              )}
              <Link
                aria-label="Full explorer"
                title="Full explorer"
                href={
                  selected
                    ? `/app/map?place=${encodeURIComponent(selected.slug)}`
                    : "/app/map"
                }
              >
                <span>Full explorer</span> <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
          {canvas}
          <p className="atlas-touch-note">
            Use two fingers to move the map, or open the place index.
          </p>
        </section>
      ) : (
        <div className="atlas-workbench">
          <section className="atlas-panel" aria-label="Map explorer controls">
            <header className="atlas-intro">
              <h1>Map explorer</h1>
              <p>
                Salcedo, Ilocos Sur <i /> {barangays.length} barangays
              </p>
            </header>
            <div className="atlas-find">
              <div className="atlas-find-row">
                <AtlasSearch
                  places={mapped}
                  areas={barangays}
                  lines={lines}
                  online={online}
                  onChoose={chooseHit}
                />
                <button
                  className="atlas-filter"
                  aria-label="Filter map places"
                  title="Filter map places"
                  aria-haspopup="dialog"
                  onClick={() => setFilterOpen(true)}
                >
                  <SlidersHorizontal size={17} />
                  {filtered && <i />}
                </button>
              </div>
              <div className="atlas-scopes" aria-label="Place collections">
                {SCOPES.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    aria-pressed={scope === id}
                    onClick={() => {
                      setScope(id);
                      setFocus(EMPTY);
                    }}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
              {filtered && tags}
            </div>
            <div className="atlas-index-head">
              <div>
                <span className="atlas-eyebrow">Place index</span>
                <b>{pins.length}</b>
              </div>
              {sortSelect}
            </div>
            <div className="atlas-index-scroll">
              {pins.length ? (
                <PlaceIndex
                  pins={index}
                  selectedId={selected?.id}
                  onPlace={select}
                />
              ) : (
                empty
              )}
            </div>
            <div className="atlas-index-foot">
              <Link href="/app/more#sources">
                Map sources <ArrowUpRight size={12} />
              </Link>
            </div>
          </section>
          {canvas}
        </div>
      )}
      {listOpen && (
        <Modal
          label={stack ? "Nearby places" : "Place index"}
          onClose={() => setListOpen(false)}
        >
          <div className="atlas-dialog atlas-list-dialog">
            <div className="atlas-dialog-head">
              <div>
                <span className="atlas-eyebrow">
                  {stack ? "At this location" : "Municipal field atlas"}
                </span>
                <h2>
                  {stack ? "Nearby places" : "Place index"}{" "}
                  <small>{(stack || index).length}</small>
                </h2>
              </div>
              <button
                className="atlas-icon"
                onClick={() => setListOpen(false)}
                aria-label="Close place index"
              >
                <X size={18} />
              </button>
            </div>
            {!compact && !stack && sortSelect}
            {pins.length ? (
              <PlaceIndex
                pins={stack || index}
                selectedId={selected?.id}
                onPlace={select}
              />
            ) : (
              empty
            )}
          </div>
        </Modal>
      )}
      {filterOpen && (
        <Modal label="Filter map places" onClose={() => setFilterOpen(false)}>
          <form
            className="atlas-dialog atlas-filter-form"
            onSubmit={(e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              setScope(d.get("scope") as MapScope);
              setFilters({
                area: String(d.get("area")),
                type: String(d.get("type")),
              });
              setFocus(EMPTY);
              setFilterOpen(false);
            }}
          >
            <div className="atlas-dialog-head">
              <div>
                <span className="atlas-eyebrow">Place index</span>
                <h2>Filter the map</h2>
              </div>
              <button
                type="button"
                className="atlas-icon"
                onClick={() => setFilterOpen(false)}
                aria-label="Close map filters"
              >
                <X size={18} />
              </button>
            </div>
            <label>
              Collection
              <select name="scope" defaultValue={scope}>
                {SCOPES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Barangay
              <select name="area" defaultValue={filters.area}>
                <option value="">All barangays</option>
                {barangays.map((b) => (
                  <option key={b.id} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Place type
              <select name="type" defaultValue={filters.type}>
                <option value="">All place types</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t}>
                    {filterTypeName(t)}
                  </option>
                ))}
              </select>
            </label>
            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  reset();
                  setFilterOpen(false);
                }}
              >
                Clear all
              </button>
              <button className="primary-button">
                <Check size={15} />
                Apply filters
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
