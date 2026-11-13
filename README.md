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
