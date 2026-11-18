# Project CEDO: Turi App — Municipality of Salcedo, Ilocos Sur

**Official Municipal Tourism Discovery, Visitor Information, and Account-Free Itinerary Platform** for the Municipality of Salcedo, Ilocos Sur, Philippines (`2711`).

## Architecture Highlights
- **Tourist PWA (`/app`)**: Mobile-first, installable PWA (`Name: Project CEDO: Turi App`, `Short Name: Turi`, `Start URL: /app/`, `Scope: /app/`) with **zero tourist login**, offline IndexedDB itinerary drafts, interactive OpenStreetMap explorer, specialized templates for Cafés / Resorts / Restaurants / Attractions, and All About Salcedo (including all 21 official barangays).
- **Account-Free Itinerary & RA 10173 Visitor Plan System**: Tourists build, reorder, preview, download, and print trips with zero personal data. Personal visitor origin & optional contact fields are collected only at final submission with an explicit RA 10173 privacy notice, version tracking, unprechecked optional communications consent, scrypt-hashed one-time retrieval codes (`CEDO-TRIP-YYYY-XXXXXX` + `SALCEDO-XXXX-XXXX-XXXX`), code rotation, and permanent deletion.
- **Strictly Separated Visitor Analytics & Verification-Gated Physical Arrivals**: Anonymous 30-minute sessions (admin & crawler excluded, no raw IPs or fingerprints) are strictly separated from planned traveler demand and confirmed physical arrivals logged via authorized on-site verification methods.
- **Separated Admin Console (`/admin`)**: Role-based staff console (`Super Administrator`, `Tourism Administrator`, `Content Editor`, `Authorized Visitor Data Officer`) with Recharts analytics, content workflow (`Draft -> Pending Review -> Published -> Archived`), PII-restricted visitor review, CSV/JSON reports, verified check-in console, media uploads (Vercel Blob / local), and immutable audit logs.

## Local Development & Verification
```bash
npm install
npm run db:seed       # Initializes local PGlite PostgreSQL + seeds Salcedo data (when DATABASE_URL is unset)
npm run dev           # Starts Next.js on http://0.0.0.0:3000
npm run typecheck     # tsc --noEmit
npm run test          # Vitest integration tests against real PostgreSQL DDL
npm run build         # Production Next.js build
```

See `docs/DEPLOYMENT_AND_PWABUILDER.md` for Neon Postgres, Vercel Blob, PWABuilder, and Android TWA / Play Store instructions.

## Using the visitor guide
- **Home**: The original valley illustration introduces the guide. Search by place or barangay and optionally select an interest; featured places link directly to their visitor information.
- **Discover**: Compare destinations by barangay and rating, switch to the map, or save a place to a trip. Filters and sort order stay in the URL. On phones, the comparison table becomes stacked rows, with all filters in one dialog.
- **Map explorer**: Explore Salcedo’s local roads, waterways, 21 barangays and directory places without online tiles. Select a numbered group to zoom in, or browse/search the place index; save a pin, add it to your trip, or open directions. Discover’s map uses the same controls and respects the directory filters. See [field-map sources, licensing and browser tests](docs/FIELD_MAP.md).
- **Place pages**: The gallery keeps photos, illustrations, captions, and credits. Photos lead when available; representative artwork is labeled in the gallery. Visit details use label/value rows; the location panel uses real coordinates, or a municipal overview when a pin is unavailable. No media records are changed.
- **Local guide**: Barangay profiles, the municipal calendar, history, harvest products and their producers, practical advice, and emergency contacts. On phones a single section selector replaces the tab strip, and the barangay register keeps all its figures while its header row is read by screen readers rather than shown.
- **My trip**: Bookmark places for later, add stops to a draft, or start with a suggested route. Dates, multi-day scheduling, printing, and text downloads require no account. Registration is optional; save the one-time private code if you register.
- The production PWA caches its public shell and opened/saved place pages. Staff pages and API responses are never cached. Service-worker registration is disabled during development so stale builds do not hide UI changes.

### Presentation and artwork

The place register is searchable by name, barangay or type, keeps publication status visible, and labels its table. The staff overview separates app sessions, itineraries, and verified arrivals. Its Activity report includes both a chart and a daily data table; Destinations and Trip planning provide the detailed breakdowns; report tables scroll inside a keyboard-focusable region. The redesign does not change reporting definitions or staff permissions. Closing any dialog returns focus to the control that opened it.

The original guide art is in `public/images/salcedo`. To regenerate the local WebP sizes from the checked-in source list, run `node scripts/build-guide-art.mjs` after `npm ci`. This is not a build step. The worker caches small directory thumbnails and the covers used by the public shell, not the entire full-size gallery.
