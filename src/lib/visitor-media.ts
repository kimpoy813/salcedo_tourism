import artFiles from "../../public/app/art/sources.json";

// Match exact bundled assets, not uploads with a similar filename.
const originals = new Map(artFiles.map(file => [`/images/salcedo/${file}`, file.replace(/\.[^.]+$/, "")]));
originals.set("/images/salcedo/guide-valley.webp", "hero-salcedo-valley");
export function guideArtSrc(url: string, size: "thumb" | "cover") {
  const stem = originals.get(url.split(/[?#]/, 1)[0]);
  return stem ? `/app/art/${stem}-${size}.webp` : null;
}
export function photoUrl(url?: string | null) {
  return url && !guideArtSrc(url, "thumb") ? url : null;
}
export interface VisitorPhoto { url: string; caption?: string | null; attribution?: string | null }
export type GuideImage = VisitorPhoto & { kind: "photo" | "illustration" };
type MediaRow = VisitorPhoto & { isIllustrative?: boolean };

/** Retain assigned illustrations, but lead with real photos. Within each group
 * keep cover/gallery order and merge credits from duplicate gallery rows. */
export function placeMedia(cover: string | null, caption: string | null, images: MediaRow[]): GuideImage[] {
  const illustrated = new Set(images.filter(i => i.isIllustrative).map(i => i.url));
  const unique = new Map<string, GuideImage>();
  for (const row of [...(cover ? [{url: cover, caption, attribution:null}] : []), ...images]) {
    if (!row.url) continue;
    const prior = unique.get(row.url);
    unique.set(row.url, {
      url:row.url, kind: illustrated.has(row.url) || !photoUrl(row.url) ? "illustration" : "photo",
      caption: prior?.caption || row.caption, attribution:prior?.attribution || row.attribution,
    });
  }
  return [...unique.values()].sort((a,b) => Number(a.kind === "illustration") - Number(b.kind === "illustration"));
}
export interface ListingMedia {
  featuredImageUrl?: string | null;
  displayPhotoUrl?: string | null;
  displayIllustrationUrl?: string | null;
}
export function listingPhoto(p: ListingMedia) {
  return p.displayPhotoUrl !== undefined ? p.displayPhotoUrl : photoUrl(p.featuredImageUrl);
}
export function listingImage(p: ListingMedia): GuideImage | null {
  const photo = listingPhoto(p);
  if (photo) return {url:photo, kind:"photo"};
  // Older saved records may only carry the original bundled URL.
  const art = p.displayIllustrationUrl !== undefined ? p.displayIllustrationUrl :
    (p.featuredImageUrl && guideArtSrc(p.featuredImageUrl,"thumb") ? p.featuredImageUrl : null);
  return art ? {url:art, kind:"illustration"} : null;
}
export function snapshotMedia(p: ListingMedia) {
  const image = listingImage(p);
  return { featuredImageUrl: image?.kind === "photo" ? image.url : null, displayIllustrationUrl: image?.kind === "illustration" ? image.url : null };
}
