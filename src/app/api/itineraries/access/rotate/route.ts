import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import {
  generateRetrievalCode,
  hashRetrievalCode,
  verifyRetrievalCode,
} from "@/lib/crypto";
import { retrieveItinerarySchema } from "@/lib/validators";
import { checkRateLimit, getClientThrottleKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const throttle = checkRateLimit(getClientThrottleKey(req, "itin_rotate"), 10, 15 * 60 * 1000);
    if (!throttle.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = retrieveItinerarySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Reference number and current private retrieval code are required." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const [itinerary] = await db
      .select()
      .from(schema.itineraries)
      .where(eq(schema.itineraries.referenceNumber, parsed.data.referenceNumber.toUpperCase()))
      .limit(1);

    if (!itinerary) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 404 });
    }

    const [cred] = await db
      .select()
      .from(schema.itineraryAccessCredentials)
      .where(eq(schema.itineraryAccessCredentials.itineraryId, itinerary.id))
      .limit(1);

    if (!cred || cred.revokedAt || !verifyRetrievalCode(parsed.data.privateCode, cred.codeHash, cred.codeSalt)) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const newPrivateCode = generateRetrievalCode();
    const { codeHash, codeSalt } = hashRetrievalCode(newPrivateCode);

    await db
      .update(schema.itineraryAccessCredentials)
      .set({
        codeHash,
        codeSalt,
        failedAttempts: 0,
        lockedUntil: null,
        lastRotatedAt: new Date(),
      })
      .where(eq(schema.itineraryAccessCredentials.id, cred.id));

    return NextResponse.json({
      referenceNumber: itinerary.referenceNumber,
      newPrivateCode,
      rotatedAt: new Date().toISOString(),
      warning: "Your previous retrieval code is now invalid. Save your new code safely.",
    });
  } catch (err) {
    console.error("[POST /api/itineraries/access/rotate]", err);
    return NextResponse.json({ error: "Failed to rotate retrieval code." }, { status: 500 });
  }
}
