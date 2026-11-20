# Original photo masters

These PNG/JPG files are the sources for `public/app/art/*` and
`public/images/salcedo/*.webp`. They are deliberately outside `public/` so they
are not deployed or precached by the service worker.

- `npm run build:art` regenerates the 240px thumbnails and 1024px covers (WebP +
  AVIF).
- `node scripts/build-photo-derivatives.mjs` regenerates the 1400px WebP
  derivatives used by gallery and staff views.
- Old `.png`/`.jpg` URLs still resolve through redirects in `next.config.ts`, so
  existing database rows do not need rewriting.

Do not add new masters to `public/`.
