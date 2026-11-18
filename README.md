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
- **Home**: A relief plate locates the valley and links to the interactive map. The municipal seal and credited archival cacao plate replace representative landscape artwork.
- **Discover**: Search by place, activity, or barangay, or start with one of the four interests on the home page. Filters, sorting, and list/map view are reflected in the URL for sharing and returning to results.
- **Map explorer**: Explore Salcedo’s local roads, waterways, 21 barangays and directory places without online tiles. Select a numbered group to zoom in, or browse/search the place index; save a pin, add it to your trip, or open directions. Discover’s map uses the same controls and respects the directory filters. See [field-map sources, licensing and browser tests](docs/FIELD_MAP.md).
- **Place pages**: Display a place’s own cover or gallery photos, with their captions and credits. Without a photo the visitor sees a location map, not a stock image. Staff can leave the cover URL blank; no existing media records are deleted.
- **My trip**: Bookmark places for later, add stops to a draft, or start with a suggested route. Dates, multi-day scheduling, printing, and text downloads require no account. Registration is optional; save the one-time private code if you register.
- The production PWA caches its public shell and opened/saved place pages. Staff pages and API responses are never cached. Service-worker registration is disabled during development so stale builds do not hide UI changes.
