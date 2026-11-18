import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  ANYWHERE,
  groupPins,
  indexFieldLines,
  isMapped,
  searchAtlas,
  selectPins,
  type FieldData,
  type MappedPlace,
} from "../src/lib/geo/atlas";
import { isInsideSalcedo } from "../src/lib/geo/salcedo-boundary";
const p: MappedPlace = {
  id: "cafe",
  name: "Tablea Café",
  slug: "tablea-cafe",
  placeType: "cafe",
  latitude: 17.151,
  longitude: 120.536,
  barangay: { name: "Poblacion Norte", slug: "poblacion-norte" },
  shortDescription: "",
  address: "Salcedo",
  mostVisitedRank: 2,
  topRatedRank: 1,
};
const falls: MappedPlace = {
  ...p,
  id: "falls",
  name: "Baluarte Falls",
  slug: "falls",
  placeType: "nature",
  latitude: 17.0958,
  longitude: 120.5262,
  barangay: { name: "Baluarte", slug: "baluarte" },
  mostVisitedRank: 1,
  topRatedRank: 2,
};
const areas = [
  {
    id: "1",
    name: "Baluarte",
    slug: "baluarte",
    latitude: 17.099,
    longitude: 120.5215,
    publishedPlacesCount: 1,
  },
];
const data: FieldData = JSON.parse(
  readFileSync(
    new URL("../public/app/maps/salcedo-field.geojson", import.meta.url),
    "utf8",
  ),
);
describe("Salcedo field atlas", () => {
  it("publishes a compact, attributed local layer with real road and water classes", () => {
    expect(JSON.stringify(data).length).toBeLessThan(450_000);
    expect(data).toMatchObject({
      type: "FeatureCollection",
      license: expect.stringContaining("odbl"),
      attribution: expect.stringContaining("OpenStreetMap contributors"),
    });
    expect(new Set(data.features.map((f) => f.properties.kind))).toEqual(
      new Set(["street", "highway", "stream", "river", "trail", "water"]),
    );
  });
  it("indexes only named features with a coordinate on their actual line in Salcedo", () => {
    const lines = indexFieldLines(data);
    expect(lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Buaya River", kind: "water" }),
        expect.objectContaining({ kind: "road" }),
      ]),
    );
    expect(new Set(lines.map((l) => l.id)).size).toBe(lines.length);
    for (const l of lines) {
      expect(isInsideSalcedo(l.latitude, l.longitude)).toBe(true);
      expect(
        data.features.some(
          (f) =>
            f.properties.name === l.label &&
            f.geometry.type === "LineString" &&
            f.geometry.coordinates.some(
              ([x, y]) => l.latitude === y && l.longitude === x,
            ),
        ),
      ).toBe(true);
    }
  });
  it("ranks exact and accent-insensitive local names before address matches, without a network lookup", () => {
    const search = (q: string) =>
      searchAtlas(q, [p, falls], areas, indexFieldLines(data));
    expect(search("cafe")[0].slug).toBe(p.slug);
    expect(search("Poblacion Norte")[0].id).toBe("place-cafe");
    expect(search("Barangay Baluarte")[0].kind).toBe("barangay");
    expect(search("Buaya River")[0].kind).toBe("water");
    expect(search("   ")).toEqual([]);
  });
  it("intersects collections, types and areas without changing directory order or mapping invalid coordinates", () => {
    expect(isMapped(p)).toBe(true);
    for (const latitude of [null, NaN, 14.6, Infinity])
      expect(isMapped({ ...p, latitude })).toBe(false);
    const pins = [p, falls];
    expect(selectPins(pins, ANYWHERE)).toEqual([falls, p]);
    expect(selectPins(pins, ANYWHERE, undefined, "top_rated")).toEqual([
      p,
      falls,
    ]);
    expect(
      selectPins(pins, { type: "nature", area: "baluarte" }, new Set(["cafe"])),
    ).toEqual([]);
    expect(selectPins(pins, ANYWHERE, new Set(["cafe"]))).toEqual([p]);
    expect(pins).toEqual([p, falls]);
  });
  it("groups by screen distance, preserves every pin, and always exposes the selected pin", () => {
    const near = {
        ...p,
        id: "near",
        slug: "near",
        latitude: p.latitude + 0.0001,
      },
      same = { ...p, id: "same", slug: "same" };
    const pins = [p, near, same, falls];
    const at = (scale: number) => (m: MappedPlace) => ({
      x: m.longitude * scale,
      y: m.latitude * scale,
    });
    const overview = groupPins(pins, at(12000));
    expect(overview.map((g) => g.pins.length).sort()).toEqual([1, 3]);
    expect(groupPins([...pins].reverse(), at(12000))).toEqual(overview);
    expect(
      groupPins(pins, at(1000000))
        .map((g) => g.pins.length)
        .sort(),
    ).toEqual([1, 1, 2]);
    const focused = groupPins(pins, at(12000), p.id);
    expect(
      focused.find((g) => g.pins.some((q) => q.id === p.id))?.pins,
    ).toEqual([p]);
    expect(focused.flatMap((g) => g.pins)).toHaveLength(4);
  });
});
