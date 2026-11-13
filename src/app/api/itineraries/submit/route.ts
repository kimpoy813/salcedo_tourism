import { NextResponse } from "next/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { generateRetrievalCode, hashRetrievalCode } from "@/lib/crypto";
import { submitItinerarySchema } from "@/lib/validators";
import { checkRateLimit, getClientThrottleKey } from "@/lib/rate-limit";
import {
  incrementDailyAggregate,
  isAdministrativeTraffic,
  resolveOrCreateAnonymousSession,
} from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const throttle = checkRateLimit(getClientThrottleKey(req, "itin_submit"), 20, 60 * 60 * 1000);
    if (!throttle.allowed) {
      return NextResponse.json(
        { error: "Too many itinerary submissions. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = submitItinerarySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const db = await getDb();
    const { itinerary: itinInput, visitor: visitorInput, sessionToken } = parsed.data;

    // Verify all referenced stops belong to published non-placeholder destinations
    const uniquePlaceIds = Array.from(new Set(itinInput.stops.map((s) => s.placeId)));
    const validPlaces = await db
      .select({ id: schema.places.id, name: schema.places.name, slug: schema.places.slug })
      .from(schema.places)
      .where(
        and(
          inArray(schema.places.id, uniquePlaceIds),
          eq(schema.places.status, "published"),
          eq(schema.places.isPlaceholder, false)
        )
      );

    if (validPlaces.length !== uniquePlaceIds.length) {
      return NextResponse.json(
        { error: "One or more selected destinations are unavailable or unpublished." },
        { status: 400 }
      );
    }

    // Generate cryptographically random private retrieval code BEFORE transaction; never log it
    const privateCode = generateRetrievalCode();
    const { codeHash, codeSalt } = hashRetrievalCode(privateCode);

    const isAdmin = await isAdministrativeTraffic(req, "/app");
    let anonSessionId: string | null = null;
    if (!isAdmin) {
      const session = await resolveOrCreateAnonymousSession({
        req,
        providedSessionToken: sessionToken ?? undefined,
        entryPath: "/app/trips",
      });
      if (!session.isLikelyBot) {
        anonSessionId = session.sessionId;
      }
    }

    const now = new Date();
    const year = now.getUTCFullYear();
    const counterKey = `CEDO-TRIP-${year}`;
    const retentionExpiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const totalMinutes = itinInput.stops.reduce((acc, s) => acc + s.durationMinutes, 0);

    const result = await db.transaction(async (tx) => {
      const [counter] = await tx
        .insert(schema.referenceCounters)
        .values({ key: counterKey, lastValue: 1, updatedAt: now })
        .onConflictDoUpdate({
          target: schema.referenceCounters.key,
          set: {
            lastValue: sql`${schema.referenceCounters.lastValue} + 1`,
            updatedAt: now,
          },
        })
        .returning();

      const referenceNumber = `${counterKey}-${String(counter.lastValue).padStart(6, "0")}`;

      const [createdItinerary] = await tx
        .insert(schema.itineraries)
        .values({
          referenceNumber,
          title: itinInput.title,
          plannedVisitDate: itinInput.plannedVisitDate,
          description: itinInput.description ?? null,
          totalStops: itinInput.stops.length,
          estimatedTotalMinutes: totalMinutes,
          status: "submitted",
          expiresAt: retentionExpiresAt,
        })
        .returning();

      const orderedStops = [...itinInput.stops].sort((a, b) => a.stopOrder - b.stopOrder);
      await tx.insert(schema.itineraryStops).values(
        orderedStops.map((stop, idx) => ({
          itineraryId: createdItinerary.id,
          placeId: stop.placeId,
          stopOrder: idx + 1,
          visitTime: stop.visitTime ?? null,
          durationMinutes: stop.durationMinutes,
          personalNotes: stop.personalNotes ?? null,
        }))
      );

      await tx.insert(schema.itineraryAccessCredentials).values({
        itineraryId: createdItinerary.id,
        codeHash,
        codeSalt,
        failedAttempts: 0,
      });

      const [createdSubmission] = await tx
        .insert(schema.visitorSubmissions)
        .values({
          itineraryId: createdItinerary.id,
          originMunicipality: visitorInput.originMunicipality,
          originProvince: visitorInput.originProvince,
          originCountry: visitorInput.originCountry || "Philippines",
          plannedVisitDate: visitorInput.plannedVisitDate,
          travelerCount: visitorInput.travelerCount,
          purposeOfVisit: visitorInput.purposeOfVisit ?? null,
          firstTimeVisitor: visitorInput.firstTimeVisitor ?? null,
          transportationType: visitorInput.transportationType ?? null,
          lengthOfStay: visitorInput.lengthOfStay ?? null,
          discoverySource: visitorInput.discoverySource ?? null,
          interestedAttractions: visitorInput.interestedAttractions ?? null,
          preferredExperience: visitorInput.preferredExperience ?? null,
          privacyNoticeVersion: visitorInput.privacyNoticeVersion,
          privacyAcknowledgedAt: now,
          retentionExpiresAt,
        })
        .returning();

      await tx.insert(schema.visitorContactInformation).values({
        submissionId: createdSubmission.id,
        visitorName: visitorInput.visitorName?.trim() || null,
        contactNumber: visitorInput.contactNumber?.trim() || null,
        emailAddress: visitorInput.emailAddress?.trim() || null,
        followUpConsentGiven: Boolean(visitorInput.followUpConsentGiven),
        consentRecordedAt: visitorInput.followUpConsentGiven ? now : null,
      });

      await tx.insert(schema.visitorPrivacyAcknowledgments).values({
        submissionId: createdSubmission.id,
        noticeVersion: visitorInput.privacyNoticeVersion,
        acknowledged: true,
        followUpConsent: Boolean(visitorInput.followUpConsentGiven),
        retentionPolicySummary:
          "Retained up to 365 days under RA 10173 unless earlier deleted/anonymized by visitor.",
      });

      await tx.insert(schema.itineraryEvents).values({
        sessionId: anonSessionId,
        idempotencyKey: `submit-${createdItinerary.id}`,
        eventType: "submitted",
        itineraryId: createdItinerary.id,
        stopCount: itinInput.stops.length,
        travelerCount: visitorInput.travelerCount,
        plannedVisitDate: visitorInput.plannedVisitDate,
        placeIdsJson: orderedStops.map((s) => s.placeId),
      });

      return createdItinerary;
    });

    const today = now.toISOString().slice(0, 10);
    await Promise.all([
      incrementDailyAggregate(today, "itineraries_submitted", "all", 1),
      incrementDailyAggregate(today, "planned_travelers", "all", visitorInput.travelerCount),
    ]);

    return NextResponse.json(
      {
        referenceNumber: result.referenceNumber,
        privateCode,
        warning:
          "Save or download your Private Retrieval Code right now. For your privacy, it is never stored in plain text or recoverable if lost.",
        itinerary: {
          id: result.id,
          referenceNumber: result.referenceNumber,
          title: result.title,
          plannedVisitDate: result.plannedVisitDate,
          totalStops: result.totalStops,
          estimatedTotalMinutes: result.estimatedTotalMinutes,
          expiresAt: result.expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/itineraries/submit]", err);
    return NextResponse.json(
      { error: "Failed to save itinerary and visitor plan." },
      { status: 500 }
    );
  }
}
