import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { verifyRetrievalCode } from "@/lib/crypto";
import { retrieveItinerarySchema } from "@/lib/validators";
import { checkRateLimit, getClientThrottleKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const throttle = checkRateLimit(getClientThrottleKey(req, "itin_delete"), 10, 15 * 60 * 1000);
    if (!throttle.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = retrieveItinerarySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Reference number and private retrieval code are required to delete your plan." },
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

    await db.transaction(async (tx) => {
      // Cascade deletion removes stops, credentials, visitor submission, contact info & acknowledgments
      await tx.delete(schema.itineraries).where(eq(schema.itineraries.id, itinerary.id));
    });

    return NextResponse.json({
      deleted: true,
      referenceNumber: itinerary.referenceNumber,
      message:
        "Your itinerary and associated personal visitor submission data have been permanently deleted under RA 10173.",
    });
  } catch (err) {
    console.error("[POST /api/itineraries/delete]", err);
    return NextResponse.json({ error: "Failed to delete itinerary." }, { status: 500 });
  }
}
