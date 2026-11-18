import { describe, expect, it } from "vitest";
import { interests, selectDirectoryPlaces } from "../src/lib/guide-interests";
import type { PlaceCardData } from "../src/components/app/PlaceCard";

const fixture = (name: string, placeType: string, rank: number): PlaceCardData => ({
  id: name,
  name,
  slug: name,
  placeType,
  shortDescription: "",
  address: "Salcedo",
  mostVisitedRank: rank,
  primaryCategory: { name: placeType, slug: placeType },
  barangay: { name: "Baluarte", slug: "baluarte" },
});
const places = [
  fixture("Tablea Café", "cafe", 3),
  fixture("Falls", "nature", 1),
  fixture("Eatery", "restaurant", 2),
];

describe("field guide directory", () => {
  it("combines food interests and precise deep-linked filters", () => {
    const interest = interests.find((i) => i.key === "food");
    expect(selectDirectoryPlaces(places, { interest }).map((p) => p.name)).toEqual([
      "Eatery",
      "Tablea Café",
    ]);
    expect(
      selectDirectoryPlaces(places, {
        interest,
        type: "cafe",
        barangay: "baluarte",
        category: "cafe",
        query: "cafe",
      }),
    ).toEqual([places[0]]);
    expect(selectDirectoryPlaces(places, { interest, barangay: "other" })).toEqual([]);
  });
  it("keeps ranking order and leaves the shared inventory untouched", () => {
    expect(selectDirectoryPlaces(places, {}).map((p) => p.mostVisitedRank)).toEqual([1, 2, 3]);
    expect(places.map((p) => p.mostVisitedRank)).toEqual([3, 1, 2]);
    expect(selectDirectoryPlaces(places, { sort: "name" })[0].name).toBe("Eatery");
  });
  it("supports the existing attraction filter and partial place searches", () => {
    expect(selectDirectoryPlaces(places, { type: "attraction", query: " all " })).toEqual([
      places[1],
    ]);
  });
});
