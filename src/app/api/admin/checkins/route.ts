import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { sha256Hex } from "@/lib/crypto";
import { createCheckinSchema } from "@/lib/validators";
import { recordAuditLog, requireAdminApiAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApiAuth("checkins.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const db = await getDb();
  const [methods, checkins, arrivalRecords, places] = await Promise.all([
    db.select().from(schema.checkinVerificationMethods),
    db
      .select()
      .from(schema.destinationCheckins)
      .orderBy(desc(schema.destinationCheckins.checkedInAt))
      .limit(100),
    db
      .select()
      .from(schema.visitorArrivalRecords)
      .orderBy(desc(schema.visitorArrivalRecords.createdAt))
      .limit(100),
    db
      .select({ id: schema.places.id, name: schema.places.name, placeType: schema.places.placeType })
      .from(schema.places),
  ]);

  const placeMap = new Map(places.map((p) => [p.id, p]));
  const methodMap = new Map(methods.map((m) => [m.id, m]));

  return NextResponse.json({
    methods,
    places,
    checkins: checkins.map((c) => ({
      ...c,
      placeName: placeMap.get(c.placeId)?.name ?? "Unknown Place",
      methodName: methodMap.get(c.verificationMethodId)?.name ?? "Verified Check-in",
      reliabilityLabel: methodMap.get(c.verificationMethodId)?.reliabilityLabel ?? "Verified",
    })),
    totalVerifiedArrivals: arrivalRecords.reduce((acc, r) => acc + r.arrivalCount, 0),
  });
}

export async function POST(req: Request) {
  const auth = await requireAdminApiAuth("checkins.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = createCheckinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid check-in data.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const db = await getDb();

    const [[place], [method]] = await Promise.all([
      db.select().from(schema.places).where(eq(schema.places.id, input.placeId)).limit(1),
      db
        .select()
        .from(schema.checkinVerificationMethods)
        .where(eq(schema.checkinVerificationMethods.code, input.verificationMethodCode))
        .limit(1),
    ]);

    if (!place) {
      return NextResponse.json({ error: "Destination not found." }, { status: 404 });
    }
    if (!method || !method.isEnabled) {
      return NextResponse.json(
        { error: "Verification method is not enabled." },
        { status: 400 }
      );
    }

    let itineraryId: string | null = null;
    if (input.itineraryReferenceNumber) {
      const [itin] = await db
        .select({ id: schema.itineraries.id })
        .from(schema.itineraries)
        .where(eq(schema.itineraries.referenceNumber, input.itineraryReferenceNumber.toUpperCase()))
        .limit(1);
      if (itin) itineraryId = itin.id;
    }

    const today = new Date().toISOString().slice(0, 10);
    const dedupSource = `${place.id}:${today}:${itineraryId || input.clientNonce || Date.now()}:${
      input.verificationMethodCode
    }`;
    const duplicateGuardHash = sha256Hex(dedupSource);

    const existingDup = await db
      .select({ id: schema.destinationCheckins.id })
      .from(schema.destinationCheckins)
      .where(eq(schema.destinationCheckins.duplicateGuardHash, duplicateGuardHash))
      .limit(1);

    if (existingDup.length > 0) {
      return NextResponse.json(
        { error: "Duplicate verified check-in prevented for this itinerary/nonce today." },
        { status: 409 }
      );
    }

    const created = await db.transaction(async (tx) => {
      const [checkin] = await tx
        .insert(schema.destinationCheckins)
        .values({
          placeId: place.id,
          verificationMethodId: method.id,
          itineraryId,
          recordedByAdminId: auth.principal.id,
          groupSize: input.groupSize,
          verificationCodeUsed: input.verificationCodeUsed ?? null,
          duplicateGuardHash,
          checkInSource: input.checkInSource,
          notes: input.notes ?? null,
        })
        .returning();

      await tx.insert(schema.visitorArrivalRecords).values({
        checkinId: checkin.id,
        placeId: place.id,
        arrivalDate: today,
        arrivalCount: input.groupSize,
        sourceLabel: method.name,
        reliabilityTier: method.reliabilityLabel,
        verifiedByAdminId: auth.principal.id,
      });

      return checkin;
    });

    await recordAuditLog({
      principal: auth.principal,
      action: "checkin.create",
      targetType: "destination_checkin",
      targetId: created.id,
      summary: `Recorded verified on-site physical arrival (${input.groupSize} visitor(s)) at '${place.name}' via '${method.name}'.`,
    });

    return NextResponse.json({ checkin: created }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/checkins]", err);
    return NextResponse.json({ error: "Failed to record physical check-in." }, { status: 500 });
  }
}
