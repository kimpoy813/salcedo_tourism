import { describe, expect, it } from "vitest";
import { placeMutationSchema, placePatchSchema } from "../src/lib/validators";

const base = {
  name: "Baluarte Falls",
  slug: "baluarte-falls-agila-falls",
  shortDescription: "A waterfall below the western barangays.",
  description: "Long description.",
  placeType: "nature" as const,
  address: "Barangay Baluarte, Salcedo, Ilocos Sur",
  sourceReference: "Municipal tourism office",
};

describe("place create and edit validation", () => {
  it("keeps creation defaults for a new draft", () => {
    const parsed = placeMutationSchema.parse(base);
    expect(parsed.status).toBe("draft");
    expect(parsed.isFeatured).toBe(false);
    expect(parsed.isPlaceholder).toBe(false);
  });

  it("does not reset status or featured flags when an edit omits them", () => {
    const parsed = placePatchSchema.parse({
      featuredImageUrl: "/images/salcedo/municipal-seal.webp",
      latitude: 17.15107,
      longitude: 120.53634,
    });
    expect(parsed.status).toBeUndefined();
    expect(parsed.isFeatured).toBeUndefined();
    expect(parsed.isHiddenGem).toBeUndefined();
    expect(parsed.isPlaceholder).toBeUndefined();
    expect(parsed.featuredImageUrl).toBe("/images/salcedo/municipal-seal.webp");
  });

  it("still accepts an explicit status and flag change", () => {
    const parsed = placePatchSchema.parse({ status: "published", isFeatured: true });
    expect(parsed.status).toBe("published");
    expect(parsed.isFeatured).toBe(true);
  });
});
