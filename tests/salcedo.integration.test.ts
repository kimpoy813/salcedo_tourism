import { beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import fs from "node:fs";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { seedDatabase } from "../src/db/seed-core";
import {
  generateRetrievalCode,
  hashRetrievalCode,
  sha256Hex,
  verifyPassword,
  verifyRetrievalCode,
} from "../src/lib/crypto";

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;

beforeAll(async () => {
  client = new PGlite(); // In-memory isolated PostgreSQL instance
  const drizzleDir = path.join(process.cwd(), "drizzle");
  const sqlFiles = fs
    .readdirSync(drizzleDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of sqlFiles) {
    const ddl = fs.readFileSync(path.join(drizzleDir, file), "utf8");
    for (const stmt of ddl.split("--> statement-breakpoint")) {
      const trimmed = stmt.trim();
      if (trimmed) {
        await client.exec(trimmed);
      }
    }
  }
  db = drizzle(client, { schema });
  await seedDatabase(db as unknown as Parameters<typeof seedDatabase>[0]);
});

describe("Project CEDO: Turi App — Salcedo Database & Security Integration", () => {
  it("seeds all 21 official Salcedo barangays and verified landlocked data", async () => {
    const allBarangays = await db.select().from(schema.barangays);
    expect(allBarangays).toHaveLength(21);

    const names = allBarangays.map((b) => b.name);
    expect(names).toContain("Poblacion Norte");
    expect(names).toContain("Baluarte");
    expect(names).toContain("Madarang");
    expect(names).toContain("Ubbog");

    const allPlaces = await db.select().from(schema.places);
    const published = allPlaces.filter(
      (p) => p.status === "published" && !p.isPlaceholder
    );
    expect(published.length).toBeGreaterThanOrEqual(8);

    // Verify placeholders never leak into public status
    const placeholders = allPlaces.filter((p) => p.isPlaceholder);
    expect(placeholders.length).toBeGreaterThanOrEqual(2);
    for (const ph of placeholders) {
      expect(ph.status).not.toBe("published");
    }

    // Verify landlocked municipality integrity (zero beach/coastal places)
    for (const pl of published) {
      expect(pl.name.toLowerCase()).not.toContain("beach");
    }
  });

  it("hashes and verifies admin passwords and RBAC role permissions properly", async () => {
    const [superAdmin] = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.username, "cedo_superadmin"));
    expect(superAdmin).toBeDefined();
    expect(verifyPassword("SalcedoAdmin2026!", superAdmin.passwordHash)).toBe(true);
    expect(verifyPassword("WrongPassword", superAdmin.passwordHash)).toBe(false);

    // Check role permissions: content_editor must NOT have content.publish or visitor.pii.read
    const [editorRole] = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.slug, "content_editor"));
    const editorPerms = await db
      .select({ slug: schema.permissions.slug })
      .from(schema.rolePermissions)
      .innerJoin(
        schema.permissions,
        eq(schema.rolePermissions.permissionId, schema.permissions.id)
      )
      .where(eq(schema.rolePermissions.roleId, editorRole.id));

    const editorPermSlugs = editorPerms.map((p) => p.slug);
    expect(editorPermSlugs).toContain("content.edit");
    expect(editorPermSlugs).not.toContain("content.publish");
    expect(editorPermSlugs).not.toContain("visitor.pii.read");

    // Check visitor_data_officer holds visitor.pii.read and visitor.pii.delete
    const [dpoRole] = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.slug, "visitor_data_officer"));
    const dpoPerms = await db
      .select({ slug: schema.permissions.slug })
      .from(schema.rolePermissions)
      .innerJoin(
        schema.permissions,
        eq(schema.rolePermissions.permissionId, schema.permissions.id)
      )
      .where(eq(schema.rolePermissions.roleId, dpoRole.id));

    const dpoSlugs = dpoPerms.map((p) => p.slug);
    expect(dpoSlugs).toContain("visitor.pii.read");
    expect(dpoSlugs).toContain("visitor.pii.delete");
  });

  it("supports account-free itinerary submission, hashed code retrieval, rotation, and RA 10173 deletion", async () => {
    const [baluarte] = await db
      .select()
      .from(schema.places)
      .where(eq(schema.places.slug, "baluarte-falls-agila-falls"));
    expect(baluarte).toBeDefined();

    const code = generateRetrievalCode();
    expect(code).toMatch(/^SALCEDO-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    const { codeHash, codeSalt } = hashRetrievalCode(code);

    const now = new Date();
    const counterKey = `CEDO-TRIP-${now.getUTCFullYear()}`;
    const [counter] = await db
      .insert(schema.referenceCounters)
      .values({ key: counterKey, lastValue: 1, updatedAt: now })
      .onConflictDoUpdate({
        target: schema.referenceCounters.key,
        set: { lastValue: sql`${schema.referenceCounters.lastValue} + 1`, updatedAt: now },
      })
      .returning();

    const referenceNumber = `${counterKey}-${String(counter.lastValue).padStart(6, "0")}`;
    const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const [itin] = await db
      .insert(schema.itineraries)
      .values({
        referenceNumber,
        title: "Baluarte Eco-Trail",
        plannedVisitDate: "2026-12-05",
        totalStops: 1,
        estimatedTotalMinutes: 120,
        status: "submitted",
        expiresAt,
      })
      .returning();

    await db.insert(schema.itineraryStops).values({
      itineraryId: itin.id,
      placeId: baluarte.id,
      stopOrder: 1,
      durationMinutes: 120,
    });

    await db.insert(schema.itineraryAccessCredentials).values({
      itineraryId: itin.id,
      codeHash,
      codeSalt,
    });

    const [sub] = await db
      .insert(schema.visitorSubmissions)
      .values({
        itineraryId: itin.id,
        originMunicipality: "Candon City",
        originProvince: "Ilocos Sur",
        originCountry: "Philippines",
        plannedVisitDate: "2026-12-05",
        travelerCount: 3,
        privacyNoticeVersion: "2026.1-RA10173",
        privacyAcknowledgedAt: now,
        retentionExpiresAt: expiresAt,
      })
      .returning();

    await db.insert(schema.visitorContactInformation).values({
      submissionId: sub.id,
      visitorName: "Maria Santos",
      followUpConsentGiven: false, // Unprechecked default respected
    });

    // Validate hash verification (must pass with exact code and fail with wrong code)
    const [cred] = await db
      .select()
      .from(schema.itineraryAccessCredentials)
      .where(eq(schema.itineraryAccessCredentials.itineraryId, itin.id));

    expect(verifyRetrievalCode(code, cred.codeHash, cred.codeSalt)).toBe(true);
    expect(verifyRetrievalCode("SALCEDO-AAAA-BBBB-CCCC", cred.codeHash, cred.codeSalt)).toBe(false);

    // Code rotation invalidates old code
    const rotated = generateRetrievalCode();
    const rotatedHash = hashRetrievalCode(rotated);
    await db
      .update(schema.itineraryAccessCredentials)
      .set({ codeHash: rotatedHash.codeHash, codeSalt: rotatedHash.codeSalt })
      .where(eq(schema.itineraryAccessCredentials.id, cred.id));

    const [credAfterRotate] = await db
      .select()
      .from(schema.itineraryAccessCredentials)
      .where(eq(schema.itineraryAccessCredentials.itineraryId, itin.id));

    expect(verifyRetrievalCode(code, credAfterRotate.codeHash, credAfterRotate.codeSalt)).toBe(false);
    expect(verifyRetrievalCode(rotated, credAfterRotate.codeHash, credAfterRotate.codeSalt)).toBe(true);

    // Erasure cascades to stops, credentials, visitor submission & contact info
    await db.delete(schema.itineraries).where(eq(schema.itineraries.id, itin.id));
    const remainingSub = await db
      .select()
      .from(schema.visitorSubmissions)
      .where(eq(schema.visitorSubmissions.id, sub.id));
    expect(remainingSub).toHaveLength(0);
  });

  it("keeps anonymous digital views strictly separate from verified physical arrivals", async () => {
    const [bago] = await db
      .select()
      .from(schema.places)
      .where(eq(schema.places.slug, "bago-resort-spring-water"));

    const [session] = await db
      .insert(schema.anonymousSessions)
      .values({
        sessionToken: "anon-test-session-1",
        entryPath: "/app",
        deviceCategory: "mobile",
        isLikelyBot: false,
      })
      .returning();

    // First place view records; duplicate in same session is ignored by unique index
    await db
      .insert(schema.placeViewEvents)
      .values({
        sessionId: session.id,
        placeId: bago.id,
        idempotencyKey: "pv-key-1",
      })
      .onConflictDoNothing();

    await db
      .insert(schema.placeViewEvents)
      .values({
        sessionId: session.id,
        placeId: bago.id,
        idempotencyKey: "pv-key-2",
      })
      .onConflictDoNothing();

    const views = await db.select().from(schema.placeViewEvents);
    expect(views).toHaveLength(1);

    // Physical arrivals MUST remain 0 until verified on-site check-in
    const arrivalsBefore = await db.select().from(schema.visitorArrivalRecords);
    expect(arrivalsBefore).toHaveLength(0);

    // Record an authorized staff check-in
    const [method] = await db
      .select()
      .from(schema.checkinVerificationMethods)
      .where(eq(schema.checkinVerificationMethods.code, "staff_assisted"));

    const [checkin] = await db
      .insert(schema.destinationCheckins)
      .values({
        placeId: bago.id,
        verificationMethodId: method.id,
        groupSize: 4,
        checkInSource: "Bago Resort Gate Staff",
        duplicateGuardHash: sha256Hex("bago-test-checkin-1"),
      })
      .returning();

    await db.insert(schema.visitorArrivalRecords).values({
      checkinId: checkin.id,
      placeId: bago.id,
      arrivalDate: "2026-11-13",
      arrivalCount: 4,
      sourceLabel: method.name,
      reliabilityTier: method.reliabilityLabel,
    });

    const arrivalsAfter = await db.select().from(schema.visitorArrivalRecords);
    expect(arrivalsAfter).toHaveLength(1);
    expect(arrivalsAfter[0].arrivalCount).toBe(4);
  });
});
