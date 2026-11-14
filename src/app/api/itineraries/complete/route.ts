import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { verifyRetrievalCode } from "@/lib/crypto";
import { checkRateLimit, getClientThrottleKey } from "@/lib/rate-limit";
import { incrementDailyAggregate, resolveOrCreateAnonymousSession, VISITOR_SESSION_COOKIE } from "@/lib/analytics";
import { getPlaceRatingsSummary } from "@/lib/queries/public-tourism";

export const dynamic = "force-dynamic";

const completeSchema = z.object({
  referenceNumber: z.string().trim().min(4).max(40),
  privateCode: z.string().trim().min(4).max(80),
  reviewerToken: z.string().trim().min(6).max(128).optional().nullable(),
  reviewerName: z.string().trim().max(60).optional().nullable(),
  originLabel: z.string().trim().max(80).optional().nullable(),
  travelerType: z.enum(["Solo", "Couple", "Family", "Barkada", "Leisure"]).optional().default("Leisure"),
  stops: z
    .array(
      z.object({
        placeId: z.string().uuid(),
        visited: z.boolean().default(true),
        rating: z.number().int().min(1).max(5).optional().nullable(),
        comment: z.string().trim().max(500).optional().nullable(),
      })
    )
    .min(1)
    .max(25),
});

/**
 * After-trip completion: marks a submitted itinerary as actually taken,
 * stamps each visited stop, and saves the tourist's per-destination star
 * ratings into the public place-ratings system (so trips count + rank places).
 */
export async function POST(req: Request) {
  try {
    const rl = checkRateLimit(getClientThrottleKey(req, "itin_complete"), 20, 60 * 60 * 1000);
    if (!rl.allowed) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });

    const parsed = completeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Please rate with 1–5 stars and check your answers.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const input = parsed.data;
    const db = await getDb();

    const [itinerary] = await db.select().from(schema.itineraries)
      .where(eq(schema.itineraries.referenceNumber, input.referenceNumber.toUpperCase())).limit(1);
    if (!itinerary || itinerary.status === "anonymized") {
      return NextResponse.json({ error: "Invalid reference number or private retrieval code." }, { status: 404 });
    }
    const [cred] = await db.select().from(schema.itineraryAccessCredentials)
      .where(eq(schema.itineraryAccessCredentials.itineraryId, itinerary.id)).limit(1);
    if (!cred || cred.revokedAt) return NextResponse.json({ error: "Retrieval access for this itinerary has been revoked." }, { status: 403 });
    if (cred.lockedUntil && new Date(cred.lockedUntil).getTime() > Date.now()) {
      return NextResponse.json({ error: "Temporarily locked after failed attempts. Try again in 15 minutes." }, { status: 429 });
    }
    if (!verifyRetrievalCode(input.privateCode, cred.codeHash, cred.codeSalt)) {
      const nextFailures = cred.failedAttempts + 1;
      await db.update(schema.itineraryAccessCredentials)
        .set({ failedAttempts: nextFailures, lockedUntil: nextFailures >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null })
        .where(eq(schema.itineraryAccessCredentials.id, cred.id));
      return NextResponse.json({ error: "Invalid reference number or private retrieval code." }, { status: 401 });
    }

    const stops = await db.select().from(schema.itineraryStops)
      .where(eq(schema.itineraryStops.itineraryId, itinerary.id)).orderBy(asc(schema.itineraryStops.stopOrder));
    const stopByPlace = new Map(stops.map((s) => [s.placeId, s]));
    for (const s of input.stops) {
      if (!stopByPlace.has(s.placeId)) {
        return NextResponse.json({ error: "One rated destination is not part of this trip." }, { status: 400 });
      }
    }

    const session = await resolveOrCreateAnonymousSession({ req, entryPath: "/app/trips" });
    const reviewerToken = input.reviewerToken?.trim() || `trip-${itinerary.id}`;
    const now = new Date();
    const alreadyCompleted = itinerary.status === "completed";
    let visitedCount = 0;
    let ratedCount = 0;

    await db.transaction(async (tx) => {
      for (const s of input.stops) {
        const stop = stopByPlace.get(s.placeId)!;
        if (s.visited) {
          visitedCount += 1;
          if (!stop.visitedAt) {
            await tx.update(schema.itineraryStops).set({ visitedAt: now }).where(eq(schema.itineraryStops.id, stop.id));
          }
        }
        if (s.visited && s.rating) {
          ratedCount += 1;
          await tx.insert(schema.placeRatings).values({
            placeId: s.placeId,
            anonymousSessionId: session.sessionId,
            reviewerToken,
            reviewerName: input.reviewerName?.trim() || "Salcedo Visitor",
            originLabel: input.originLabel?.trim() || null,
            rating: s.rating,
            comment: s.comment?.trim() || null,
            travelerType: input.travelerType,
            status: "published",
            createdAt: now,
            updatedAt: now,
          }).onConflictDoUpdate({
            target: [schema.placeRatings.placeId, schema.placeRatings.reviewerToken],
            set: { rating: s.rating, comment: s.comment?.trim() || null, reviewerName: input.reviewerName?.trim() || "Salcedo Visitor", originLabel: input.originLabel?.trim() || null, travelerType: input.travelerType, updatedAt: now },
          });
        }
      }
      await tx.update(schema.itineraries)
        .set({ status: "completed", completedAt: itinerary.completedAt ?? now, updatedAt: now })
        .where(eq(schema.itineraries.id, itinerary.id));
      await tx.insert(schema.itineraryEvents).values({
        sessionId: session.sessionId,
        idempotencyKey: `trip-completed-${itinerary.id}-${now.getTime()}`,
        eventType: "trip_completed",
        itineraryId: itinerary.id,
        stopCount: visitedCount,
        placeIdsJson: input.stops.filter((s) => s.visited).map((s) => s.placeId),
      });
    });

    const today = now.toISOString().slice(0, 10);
    if (!alreadyCompleted) await incrementDailyAggregate(today, "trips_completed", "all", 1);
    if (visitedCount > 0) await incrementDailyAggregate(today, "stops_visited", "all", visitedCount);
    if (ratedCount > 0) await incrementDailyAggregate(today, "trip_ratings_submitted", "all", ratedCount);

    const summaries: Record<string, unknown> = {};
    for (const s of input.stops) {
      if (s.rating) summaries[s.placeId] = await getPlaceRatingsSummary(s.placeId);
    }

    const res = NextResponse.json({
      referenceNumber: itinerary.referenceNumber,
      status: "completed",
      completedAt: (itinerary.completedAt ?? now).toISOString(),
      visitedCount,
      ratedCount,
      ratingSummaries: summaries,
      message: `Trip counted by the Salcedo Tourism Office: ${visitedCount} destination(s) visited, ${ratedCount} rating(s) saved. Daghang salamat!`,
    }, { status: 200 });
    res.cookies.set(VISITOR_SESSION_COOKIE, session.sessionToken, { httpOnly: false, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return res;
  } catch (err) {
    console.error("[POST /api/itineraries/complete]", err);
    return NextResponse.json({ error: "Could not complete your trip. Please try again." }, { status: 500 });
  }
}
