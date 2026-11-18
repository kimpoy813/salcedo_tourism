import type { PlaceCardData } from "@/components/app/PlaceCard";
import {
  isInsideSalcedo,
  SALCEDO_CENTER,
  type LatLngTuple,
} from "./salcedo-boundary";

export interface MapBarangayItem {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  publishedPlacesCount: number;
}
export type MappedPlace = PlaceCardData & {
  latitude: number;
  longitude: number;
};
export type MapScope = "all" | "saved" | "trip";
export type MapSort = "most_visited" | "top_rated" | "by_category";
export type MapFilters = { area: string; type: string };
export const ANYWHERE: MapFilters = { area: "", type: "" };
export const TONES = {
  nature: { color: "#347059", name: "Outdoors" },
  stay: { color: "#367882", name: "Stays" },
  food: { color: "#ae5738", name: "Food & drink" },
  culture: { color: "#93682d", name: "Culture" },
  service: { color: "#616985", name: "Services" },
} as const;
export type Tone = keyof typeof TONES;
const GROUP: Record<string, Tone> = {
  nature: "nature",
  attraction: "nature",
  accommodation: "stay",
  resort: "stay",
  cafe: "food",
  restaurant: "food",
  business: "culture",
  heritage: "culture",
  service: "service",
};
export function placeTone(p: PlaceCardData): Tone {
  return GROUP[p.placeType] || "service";
}
export function shortName(name: string) {
  return name.split(" (")[0];
}
export function isMapped(p: PlaceCardData): p is MappedPlace {
  return (
    p.latitude != null &&
    p.longitude != null &&
    Number.isFinite(p.latitude) &&
    Number.isFinite(p.longitude) &&
    isInsideSalcedo(p.latitude, p.longitude)
  );
}
export function selectPins(
  places: MappedPlace[],
  filters: MapFilters,
  scopeIds?: ReadonlySet<string>,
  sort: MapSort = "most_visited",
) {
  const pins = places.filter(
    (p) =>
      (!filters.area || p.barangay?.slug === filters.area) &&
      (!filters.type ||
        p.placeType === filters.type ||
        (filters.type === "nature" && p.placeType === "attraction")) &&
      (!scopeIds || scopeIds.has(p.id)),
  );
  return pins.sort((a, b) => {
    if (sort === "by_category") {
      const cat = (a.primaryCategory?.name || a.placeType).localeCompare(
        b.primaryCategory?.name || b.placeType,
      );
      if (cat) return cat;
    }
    const key =
      sort === "most_visited"
        ? "mostVisitedRank"
        : sort === "top_rated"
          ? "topRatedRank"
          : "categoryRank";
    return (
      (a[key] ?? Infinity) - (b[key] ?? Infinity) ||
      a.name.localeCompare(b.name)
    );
  });
}
export interface MapHit {
  id: string;
  label: string;
  subtitle: string;
  kind: "place" | "barangay" | "road" | "water" | "osm";
  slug?: string;
  latitude: number;
  longitude: number;
}
export function normalizeMapText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bbarangay\b/g, "brgy")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
export function searchAtlas(
  query: string,
  places: MappedPlace[],
  areas: MapBarangayItem[],
  lines: MapHit[],
): MapHit[] {
  const q = normalizeMapText(query);
  if (!q) return [];
  const items: MapHit[] = [
    ...places.map((p) => ({
      id: `place-${p.id}`,
      label: p.name,
      slug: p.slug,
      subtitle:
        p.barangay &&
        !normalizeMapText(p.address).includes(normalizeMapText(p.barangay.name))
          ? `Brgy. ${p.barangay.name} · ${p.address}`
          : p.address,
      kind: "place" as const,
      latitude: p.latitude,
      longitude: p.longitude,
    })),
    ...areas.map((a) => ({
      id: `brgy-${a.id}`,
      label: `Brgy. ${a.name}`,
      slug: a.slug,
      subtitle: "Barangay · Salcedo",
      kind: "barangay" as const,
      latitude: a.latitude,
      longitude: a.longitude,
    })),
    ...lines,
  ];
  const score = (hit: MapHit) => {
    const full = normalizeMapText(hit.label);
    const title = full.replace(/^brgy /, "");
    return full === q || title === q
      ? 0
      : title.startsWith(q)
        ? 1
        : title.includes(q)
          ? 2
          : normalizeMapText(hit.label + " " + hit.subtitle).includes(q)
            ? 3
            : 4;
  };
  return items
    .map((hit) => ({ hit, score: score(hit) }))
    .filter((row) => row.score < 4)
    .sort((a, b) => a.score - b.score || a.hit.label.localeCompare(b.hit.label))
    .slice(0, 8)
    .map((row) => row.hit);
}
export type FieldKind =
  "highway" | "street" | "trail" | "river" | "stream" | "water";
export type FieldData = GeoJSON.FeatureCollection<
  | GeoJSON.LineString
  | GeoJSON.MultiLineString
  | GeoJSON.Polygon
  | GeoJSON.MultiPolygon,
  { kind: FieldKind; name?: string }
>;
/** Only offer named features with a point on the actual line inside Salcedo, not a bounding-box center. */
export function indexFieldLines(data: FieldData): MapHit[] {
  const names = new Map<string, MapHit & { distance: number }>();
  for (const f of data.features) {
    const name = f.properties.name;
    if (
      !name ||
      (f.geometry.type !== "LineString" &&
        f.geometry.type !== "MultiLineString")
    )
      continue;
    const water =
      f.properties.kind === "river" || f.properties.kind === "stream";
    const id = (water ? "water-" : "road-") + normalizeMapText(name);
    for (const [lon, lat] of f.geometry.type === "LineString"
      ? f.geometry.coordinates
      : f.geometry.coordinates.flat()) {
      const distance =
        (lon - SALCEDO_CENTER[1]) ** 2 + (lat - SALCEDO_CENTER[0]) ** 2;
      if (
        distance >= (names.get(id)?.distance ?? Infinity) ||
        !isInsideSalcedo(lat, lon)
      )
        continue;
      names.set(id, {
        id,
        label: name,
        kind: water ? "water" : "road",
        subtitle: water ? "Waterway · Field map" : "Road · Field map",
        latitude: lat,
        longitude: lon,
        distance,
      });
    }
  }
  return [...names.values()];
}
export type Pixel = { x: number; y: number };
/** Nearby markers become one target in screen pixels; zooming in separates them.
 * The selected pin is always individually addressable, even at identical coordinates. */
export function groupPins(
  pins: MappedPlace[],
  project: (p: MappedPlace) => Pixel,
  selectedId?: string,
  radius = 39,
) {
  const groups: { pins: MappedPlace[]; point: Pixel; center: LatLngTuple }[] =
    [];
  // Stable seeds: changing the list sort must not reshuffle the map.
  for (const p of [...pins].sort((a, b) => a.slug.localeCompare(b.slug))) {
    const pixel = project(p);
    const near =
      p.id !== selectedId
        ? groups.find(
            (g) =>
              g.pins[0].id !== selectedId &&
              Math.hypot(pixel.x - g.point.x, pixel.y - g.point.y) < radius,
          )
        : undefined;
    if (!near) {
      groups.push({
        pins: [p],
        point: pixel,
        center: [p.latitude, p.longitude],
      });
      continue;
    }
    const n = near.pins.push(p);
    near.point = {
      x: near.point.x + (pixel.x - near.point.x) / n,
      y: near.point.y + (pixel.y - near.point.y) / n,
    };
    near.center = [
      near.center[0] + (p.latitude - near.center[0]) / n,
      near.center[1] + (p.longitude - near.center[1]) / n,
    ];
  }
  return groups;
}
export function directionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
