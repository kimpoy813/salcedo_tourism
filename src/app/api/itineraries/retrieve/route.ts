import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { verifyRetrievalCode } from "@/lib/crypto";
import { retrieveItinerarySchema } from "@/lib/validators";
import { checkRateLimit, getClientThrottleKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const throttle = checkRateLimit(getClientThrottleKey(req, "itin_retrieve"), 15, 15 * 60 * 1000);
    if (!throttle.allowed) {
      return NextResponse.json(
        { error: "Too many retrieval attempts. Please wait 15 minutes and try again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = retrieveItinerarySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Both reference number and private retrieval code are required." },
        { status: 400 }
      );
    }

    const referenceNumber = parsed.data.referenceNumber.toUpperCase();
    const privateCode = parsed.data.privateCode;

    const db = await getDb();
    const [itinerary] = await db
      .select()
      .from(schema.itineraries)
      .where(eq(schema.itineraries.referenceNumber, referenceNumber))
      .limit(1);

    if (!itinerary || itinerary.status === "anonymized") {
      return NextResponse.json(
        { error: "Invalid reference number or private retrieval code." },
        { status: 404 }
      );
    }

    const [cred] = await db
      .select()
      .from(schema.itineraryAccessCredentials)
      .where(eq(schema.itineraryAccessCredentials.itineraryId, itinerary.id))
      .limit(1);

    if (!cred || cred.revokedAt) {
      return NextResponse.json(
        { error: "Retrieval access for this itinerary has been revoked." },
        { status: 403 }
      );
    }

    if (cred.lockedUntil && new Date(cred.lockedUntil).getTime() > Date.now()) {
      return NextResponse.json(
        { error: "Too many failed attempts for this itinerary. Temporarily locked for 15 minutes." },
        { status: 429 }
      );
    }

    const valid = verifyRetrievalCode(privateCode, cred.codeHash, cred.codeSalt);
    if (!valid) {
      const nextFailures = cred.failedAttempts + 1;
      const lockedUntil =
        nextFailures >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await db
        .update(schema.itineraryAccessCredentials)
        .set({ failedAttempts: nextFailures, lockedUntil })
        .where(eq(schema.itineraryAccessCredentials.id, cred.id));

      return NextResponse.json(
        { error: "Invalid reference number or private retrieval code." },
        { status: 401 }
      );
    }

    // Reset failed attempts on successful verification
    if (cred.failedAttempts > 0 || cred.lockedUntil) {
      await db
        .update(schema.itineraryAccessCredentials)
        .set({ failedAttempts: 0, lockedUntil: null })
        .where(eq(schema.itineraryAccessCredentials.id, cred.id));
    }

    const [stops, submission] = await Promise.all([
      db
        .select({
          id: schema.itineraryStops.id,
          stopOrder: schema.itineraryStops.stopOrder,
          visitTime: schema.itineraryStops.visitTime,
          durationMinutes: schema.itineraryStops.durationMinutes,
          personalNotes: schema.itineraryStops.personalNotes,
          visitedAt: schema.itineraryStops.visitedAt,
          placeId: schema.places.id,
          placeName: schema.places.name,
          placeSlug: schema.places.slug,
          placeType: schema.places.placeType,
          placeAddress: schema.places.address,
          latitude: schema.places.latitude,
          longitude: schema.places.longitude,
          featuredImageUrl: schema.places.featuredImageUrl,
        })
        .from(schema.itineraryStops)
        .innerJoin(schema.places, eq(schema.itineraryStops.placeId, schema.places.id))
        .where(eq(schema.itineraryStops.itineraryId, itinerary.id))
        .orderBy(asc(schema.itineraryStops.stopOrder)),
      db
        .select({
          originMunicipality: schema.visitorSubmissions.originMunicipality,
          originProvince: schema.visitorSubmissions.originProvince,
          originCountry: schema.visitorSubmissions.originCountry,
          plannedVisitDate: schema.visitorSubmissions.plannedVisitDate,
          travelerCount: schema.visitorSubmissions.travelerCount,
          purposeOfVisit: schema.visitorSubmissions.purposeOfVisit,
          transportationType: schema.visitorSubmissions.transportationType,
          lengthOfStay: schema.visitorSubmissions.lengthOfStay,
          privacyNoticeVersion: schema.visitorSubmissions.privacyNoticeVersion,
          retentionExpiresAt: schema.visitorSubmissions.retentionExpiresAt,
        })
        .from(schema.visitorSubmissions)
        .where(eq(schema.visitorSubmissions.itineraryId, itinerary.id))
        .limit(1)
        .then((r) => r[0] ?? null),
    ]);

    return NextResponse.json({
      itinerary: {
        id: itinerary.id,
        referenceNumber: itinerary.referenceNumber,
        title: itinerary.title,
        plannedVisitDate: itinerary.plannedVisitDate,
        description: itinerary.description,
        totalStops: itinerary.totalStops,
        estimatedTotalMinutes: itinerary.estimatedTotalMinutes,
        status: itinerary.status,
        completedAt: itinerary.completedAt,
        createdAt: itinerary.createdAt,
        expiresAt: itinerary.expiresAt,
        stops,
        tripSummary: submission,
      },
    });
  } catch (err) {
    console.error("[POST /api/itineraries/retrieve]", err);
    return NextResponse.json({ error: "Failed to retrieve itinerary." }, { status: 500 });
  }
}
