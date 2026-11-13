import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../src/db/schema";
import { seedDatabase, seedSampleActivityData } from "../src/db/seed-core";
import {
  SALCEDO_BARANGAY_POLYGONS,
  SALCEDO_BOUNDS,
  SALCEDO_MUNICIPAL_POLYGON,
  type LatLngTuple,
} from "../src/lib/geo/salcedo-boundary";

function pointInPolygon(lat: number, lng: number, ring: LatLngTuple[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i];
    const [yj, xj] = ring[j];
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

describe("Salcedo Sample Data & Municipal Geo-Boundary Verification", () => {
  it("highlights Salcedo municipality accurately across all 21 official barangays", () => {
    expect(SALCEDO_MUNICIPAL_POLYGON.length).toBeGreaterThanOrEqual(30);
    expect(SALCEDO_BARANGAY_POLYGONS).toHaveLength(21);
    expect(SALCEDO_BOUNDS.south).toBeLessThan(SALCEDO_BOUNDS.north);
    expect(SALCEDO_BOUNDS.west).toBeLessThan(SALCEDO_BOUNDS.east);

    // Every barangay polygon centroid must sit inside Salcedo municipal bounds
    for (const brgy of SALCEDO_BARANGAY_POLYGONS) {
      expect(brgy.coordinates.length).toBeGreaterThanOrEqual(4);
      for (const [lat, lng] of brgy.coordinates) {
        expect(lat).toBeGreaterThanOrEqual(SALCEDO_BOUNDS.south - 0.01);
        expect(lat).toBeLessThanOrEqual(SALCEDO_BOUNDS.north + 0.01);
        expect(lng).toBeGreaterThanOrEqual(SALCEDO_BOUNDS.west - 0.01);
        expect(lng).toBeLessThanOrEqual(SALCEDO_BOUNDS.east + 0.01);
      }
    }

    // Key Salcedo tourist destinations & town center sit strictly inside Salcedo boundary
    expect(pointInPolygon(17.1508, 120.536, SALCEDO_MUNICIPAL_POLYGON)).toBe(true); // Town Plaza
    expect(pointInPolygon(17.099, 120.5215, SALCEDO_MUNICIPAL_POLYGON)).toBe(true); // Baluarte Falls
    expect(pointInPolygon(17.1415, 120.5675, SALCEDO_MUNICIPAL_POLYGON)).toBe(true); // Bago Resort
    expect(pointInPolygon(17.1241, 120.5037, SALCEDO_MUNICIPAL_POLYGON)).toBe(true); // Culiong (west)
    expect(pointInPolygon(17.1587, 120.578, SALCEDO_MUNICIPAL_POLYGON)).toBe(true); // Madarang (east)
    // Neighboring Candon City coast lies outside Salcedo boundary
    expect(pointInPolygon(17.194, 120.448, SALCEDO_MUNICIPAL_POLYGON)).toBe(false);
  });

  it("seeds sample places, itineraries, verified check-ins, and analytics idempotently", async () => {
    const client = new PGlite();
    const ddl = fs.readFileSync(
      path.join(process.cwd(), "drizzle", "0000_init_salcedo_tourism.sql"),
      "utf8"
    );
    for (const stmt of ddl.split("--> statement-breakpoint")) {
      const trimmed = stmt.trim();
      if (trimmed) await client.exec(trimmed);
    }
    const db = drizzle(client, { schema }) as unknown as Parameters<typeof seedDatabase>[0];

    await seedDatabase(db);
    await seedSampleActivityData(db);
    // Run a second time to verify strict idempotency
    await seedDatabase(db);
    await seedSampleActivityData(db);

    const [places, itineraries, submissions, checkins, arrivals, sessions, searches] =
      await Promise.all([
        db.select().from(schema.places),
        db.select().from(schema.itineraries),
        db.select().from(schema.visitorSubmissions),
        db.select().from(schema.destinationCheckins),
        db.select().from(schema.visitorArrivalRecords),
        db.select().from(schema.anonymousSessions),
        db.select().from(schema.searchEvents),
      ]);

    const published = places.filter((p) => p.status === "published" && !p.isPlaceholder);
    expect(published.length).toBeGreaterThanOrEqual(16);
    expect(published.some((p) => p.placeType === "cafe")).toBe(true);
    expect(published.some((p) => p.placeType === "accommodation")).toBe(true);
    expect(itineraries).toHaveLength(6);
    expect(submissions).toHaveLength(6);
    expect(checkins).toHaveLength(5);
    expect(arrivals).toHaveLength(5);
    expect(sessions.length).toBe(35);
    expect(searches.length).toBe(24);
  });
});
