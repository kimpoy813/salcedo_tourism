import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../src/db/schema";
import { resetLocalTestDb } from "../src/db";
import { seedDatabase, seedSampleActivityData } from "../src/db/seed-core";
import {
  getPlaceRatingsSummary,
  getPublishedPlaces,
} from "../src/lib/queries/public-tourism";
import {
  authenticateAdminCredentials,
  signAdminToken,
  verifyAdminToken,
} from "../src/lib/admin-auth";
import {
  SALCEDO_BARANGAY_POLYGONS,
  SALCEDO_BOUNDS,
  SALCEDO_MASK_OUTER_RING,
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

async function createMigratedTestDb() {
  const client = new PGlite();
  const drizzleDir = path.join(process.cwd(), "drizzle");
  const sqlFiles = fs
    .readdirSync(drizzleDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of sqlFiles) {
    const ddl = fs.readFileSync(path.join(drizzleDir, file), "utf8");
    for (const stmt of ddl.split("--> statement-breakpoint")) {
      const trimmed = stmt.trim();
      if (trimmed) await client.exec(trimmed);
    }
  }
  return drizzle(client, { schema }) as unknown as Parameters<typeof seedDatabase>[0];
}

describe("Salcedo Sample Data, Rankings, Tourist Ratings & Geo-Boundary Verification", () => {
  it("highlights Salcedo municipality accurately across all 21 official barangays", () => {
    expect(SALCEDO_MUNICIPAL_POLYGON.length).toBeGreaterThanOrEqual(30);
    expect(SALCEDO_MASK_OUTER_RING).toHaveLength(4);
    expect(SALCEDO_BARANGAY_POLYGONS).toHaveLength(21);
    expect(SALCEDO_BOUNDS.south).toBeLessThan(SALCEDO_BOUNDS.north);
    expect(SALCEDO_BOUNDS.west).toBeLessThan(SALCEDO_BOUNDS.east);

    for (const brgy of SALCEDO_BARANGAY_POLYGONS) {
      expect(brgy.coordinates.length).toBeGreaterThanOrEqual(4);
      for (const [lat, lng] of brgy.coordinates) {
        expect(lat).toBeGreaterThanOrEqual(SALCEDO_BOUNDS.south - 0.01);
        expect(lat).toBeLessThanOrEqual(SALCEDO_BOUNDS.north + 0.01);
        expect(lng).toBeGreaterThanOrEqual(SALCEDO_BOUNDS.west - 0.01);
        expect(lng).toBeLessThanOrEqual(SALCEDO_BOUNDS.east + 0.01);
      }
    }

    expect(pointInPolygon(17.1508, 120.536, SALCEDO_MUNICIPAL_POLYGON)).toBe(true);
    expect(pointInPolygon(17.099, 120.5215, SALCEDO_MUNICIPAL_POLYGON)).toBe(true);
    expect(pointInPolygon(17.1415, 120.5675, SALCEDO_MUNICIPAL_POLYGON)).toBe(true);
    expect(pointInPolygon(17.1241, 120.5037, SALCEDO_MUNICIPAL_POLYGON)).toBe(true);
    expect(pointInPolygon(17.1587, 120.578, SALCEDO_MUNICIPAL_POLYGON)).toBe(true);
    expect(pointInPolygon(17.194, 120.448, SALCEDO_MUNICIPAL_POLYGON)).toBe(false);
  });

  it("seeds sample places, tourist ratings, rankings, itineraries, check-ins, and analytics idempotently", async () => {
    const db = await createMigratedTestDb();
    await resetLocalTestDb(db);

    await seedDatabase(db);
    await seedSampleActivityData(db);
    // Second pass verifies strict idempotency
    await seedDatabase(db);
    await seedSampleActivityData(db);

    const [places, ratings, itineraries, submissions, checkins, arrivals, sessions, searches] =
      await Promise.all([
        db.select().from(schema.places),
        db.select().from(schema.placeRatings),
        db.select().from(schema.itineraries),
        db.select().from(schema.visitorSubmissions),
        db.select().from(schema.destinationCheckins),
        db.select().from(schema.visitorArrivalRecords),
        db.select().from(schema.anonymousSessions),
        db.select().from(schema.searchEvents),
      ]);

    const published = places.filter((p) => p.status === "published" && !p.isPlaceholder);
    expect(published.length).toBeGreaterThanOrEqual(16);
    expect(ratings.length).toBeGreaterThanOrEqual(40);
    expect(itineraries).toHaveLength(6);
    expect(submissions).toHaveLength(6);
    expect(checkins).toHaveLength(5);
    expect(arrivals).toHaveLength(5);
    expect(sessions.length).toBe(35);
    expect(searches.length).toBe(24);

    // Verify Most Visited, Top Rated, and Category rankings
    const mostVisited = await getPublishedPlaces({ sort: "most_visited" });
    expect(mostVisited).toHaveLength(16);
    expect(mostVisited[0].mostVisitedRank).toBe(1);
    expect(mostVisited[0].visitCount).toBeGreaterThanOrEqual(mostVisited[1].visitCount);
    expect(mostVisited[1].mostVisitedRank).toBe(2);

    const topRated = await getPublishedPlaces({ sort: "top_rated" });
    expect(topRated[0].topRatedRank).toBe(1);
    expect(topRated[0].ratingCount).toBeGreaterThan(0);
    expect(topRated[0].averageRating).toBeGreaterThanOrEqual(4.5);

    // Account-free rating submission & live recalculation
    const targetPlace = mostVisited[0];
    const beforeSummary = await getPlaceRatingsSummary(targetPlace.id);
    await db.insert(schema.placeRatings).values({
      placeId: targetPlace.id,
      reviewerToken: "test-tourist-device-001",
      reviewerName: "Test Visitor",
      originLabel: "Candon City",
      rating: 5,
      comment: "Great spot!",
      travelerType: "Family",
      status: "published",
    });
    const afterSummary = await getPlaceRatingsSummary(targetPlace.id);
    expect(afterSummary.ratingCount).toBe(beforeSummary.ratingCount + 1);
    expect(afterSummary.reviews[0].reviewerName).toBe("Test Visitor");

    // Verify admin login works by username AND case-insensitive official email
    const byUsername = await authenticateAdminCredentials(
      "cedo_superadmin",
      "SalcedoAdmin2026!"
    );
    expect(byUsername?.username).toBe("cedo_superadmin");
    expect(byUsername?.roles).toContain("super_admin");

    const byEmail = await authenticateAdminCredentials(
      "Tourism@Salcedo-IlocosSur.gov.ph",
      "SalcedoAdmin2026!"
    );
    expect(byEmail?.username).toBe("cedo_superadmin");

    const badPass = await authenticateAdminCredentials("cedo_superadmin", "wrong");
    expect(badPass).toBeNull();

    const jwt = await signAdminToken(byEmail!.id, byEmail!.username);
    const verified = await verifyAdminToken(jwt);
    expect(verified?.adminUserId).toBe(byEmail!.id);
    expect(verified?.username).toBe("cedo_superadmin");
  });
});
