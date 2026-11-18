/** Shared representative art from the original seed. An uploaded photo with a
 * similar filename is not the same asset. Keep the stored media intact. */
const seedArt = new Set(
  [
    "guide-valley.webp",
    "hero-salcedo-valley.png",
    "baluarte-falls.png",
    "spring-water-resort.png",
    "plaza-heritage.png",
    "local-eatery-table.png",
    "rambutan-cacao-harvest.png",
    "gallery-cafe-tablea.jpg",
    "gallery-heritage-church.jpg",
    "gallery-ilocano-grill.jpg",
    "gallery-mountain-viewpoint.jpg",
    "gallery-resort-cottages.jpg",
    "gallery-waterfall-pool.jpg",
  ].map((file) => `/images/salcedo/${file}`),
);

export function photoUrl(url?: string | null) {
  return url && !seedArt.has(url.split(/[?#]/, 1)[0]) ? url : null;
}

export interface VisitorPhoto {
  url: string;
  caption?: string | null;
  attribution?: string | null;
}
type MediaRow = VisitorPhoto & { isIllustrative?: boolean };

/** Cover first, then editorial order. An explicit illustration flag also applies
 * when that same URL is set as the cover. Don't lose a gallery credit on dedup. */
export function placePhotos(
  cover: string | null,
  caption: string | null,
  images: MediaRow[],
): VisitorPhoto[] {
  const excluded = new Set(images.filter((i) => i.isIllustrative).map((i) => i.url));
  const photos = new Map<string, VisitorPhoto>();
  for (const image of [...(cover ? [{ url: cover, caption, attribution: null }] : []), ...images]) {
    if (!photoUrl(image.url) || excluded.has(image.url)) continue;
    const prior = photos.get(image.url);
    photos.set(image.url, {
      url: image.url,
      caption: prior?.caption || image.caption,
      attribution: prior?.attribution || image.attribution,
    });
  }
  return [...photos.values()];
}

/** Older on-device bookmarks have only featuredImageUrl. A resolved null is
 * meaningful: don't reintroduce an explicitly illustrative cover. */
export function listingPhoto(p: {
  displayPhotoUrl?: string | null;
  featuredImageUrl?: string | null;
}) {
  return p.displayPhotoUrl !== undefined ? p.displayPhotoUrl : photoUrl(p.featuredImageUrl);
}
