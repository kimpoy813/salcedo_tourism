import { describe, expect, it } from "vitest";
import { guideArtSrc, listingImage, listingPhoto, photoUrl, placeMedia, snapshotMedia } from "../src/lib/visitor-media";
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
      placeMedia("/uploads/painting.jpg", null, [
        { url: "/uploads/painting.jpg", isIllustrative: true },
        { url: art },
        { url: uploaded, caption: "On the trail" },
      ]).map((i) => [i.url,i.kind]),
    ).toEqual([[uploaded,"photo"],["/uploads/painting.jpg","illustration"],[art,"illustration"]]);
    expect(placeMedia(null, null, [])).toEqual([]);
  });
  it("retains cover order, captions and photographers’ credits when deduplicating", () => {
    const other = { url: "/uploads/pool.jpg", caption: "The pool" };
    const gallery = placeMedia(uploaded, "The falls", [
      other,
      { url: uploaded, attribution: "Tourism office" },
    ]);
    expect(gallery).toEqual([
      { url: uploaded, kind:"photo", caption: "The falls", attribution: "Tourism office" },
      {...other,kind:"photo"},
    ]);
  });
  it("carries the chosen media into trip and saved-place snapshots without changing its kind", () => {
    const row = {displayPhotoUrl:null, displayIllustrationUrl:"/uploads/drawing.jpg"};
    expect(listingImage(snapshotMedia(row))).toEqual({url:row.displayIllustrationUrl,kind:"illustration"});
    expect(listingImage({featuredImageUrl:art})?.kind).toBe("illustration");
    expect(listingImage({featuredImageUrl:null})).toBeNull();
    expect(guideArtSrc(art,"thumb")).toBe("/app/art/baluarte-falls-thumb.webp");
    expect(guideArtSrc(uploaded,"thumb")).toBeNull();
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
