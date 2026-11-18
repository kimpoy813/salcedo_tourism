import { describe, expect, it } from "vitest";
import { listingPhoto, photoUrl, placePhotos } from "../src/lib/visitor-media";
import { locatorPoint, RELIEF } from "../src/lib/geo/relief";

const art = "/images/salcedo/baluarte-falls.png";
const uploaded = "/uploads/baluarte-falls.png";
describe("visitor media", () => {
  it("recognizes bundled representative art, not a photographer’s filename or every local image", () => {
    expect(photoUrl(art + "?v=2")).toBeNull();
    expect(photoUrl(uploaded)).toBe(uploaded);
    expect(photoUrl("/images/salcedo/town-plaza-2026.jpg")).toBe(
      "/images/salcedo/town-plaza-2026.jpg",
    );
  });
  it("respects an explicit gallery flag even if the same asset is the cover", () => {
    expect(
      placePhotos("/uploads/painting.jpg", null, [
        { url: "/uploads/painting.jpg", isIllustrative: true },
        { url: art },
        { url: uploaded, caption: "On the trail" },
      ]).map((i) => i.url),
    ).toEqual([uploaded]);
    expect(placePhotos(null, null, [])).toEqual([]);
  });
  it("retains cover order, captions and photographers’ credits when deduplicating", () => {
    const other = { url: "/uploads/pool.jpg", caption: "The pool" };
    const gallery = placePhotos(uploaded, "The falls", [
      other,
      { url: uploaded, attribution: "Tourism office" },
    ]);
    expect(gallery).toEqual([
      { url: uploaded, caption: "The falls", attribution: "Tourism office" },
      other,
    ]);
  });
  it("does not resurrect excluded covers from current or legacy on-device snapshots", () => {
    expect(listingPhoto({ featuredImageUrl: art })).toBeNull();
    expect(listingPhoto({ featuredImageUrl: uploaded, displayPhotoUrl: null })).toBeNull();
    expect(listingPhoto({ featuredImageUrl: art, displayPhotoUrl: uploaded })).toBe(uploaded);
  });
});
it("registers north-up place locators to the same sampled extent as the atlas", () => {
  expect(locatorPoint(RELIEF.north, RELIEF.west)).toEqual({ x: 0, y: 0 });
  expect(locatorPoint(RELIEF.south, RELIEF.east)).toEqual({ x: 1024, y: 1128 });
  const plaza = locatorPoint(17.15107, 120.53634),
    falls = locatorPoint(17.0958, 120.5262);
  expect(plaza.y).toBeLessThan(falls.y);
  expect(plaza.x).toBeGreaterThan(falls.x);
});
