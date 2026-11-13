import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, schema } from "@/db";
import {
  VISITOR_SESSION_COOKIE,
  incrementDailyAggregate,
  isAdministrativeTraffic,
  resolveOrCreateAnonymousSession,
} from "@/lib/analytics";
import { checkRateLimit, getClientThrottleKey } from "@/lib/rate-limit";
import { generateRandomToken } from "@/lib/crypto";

export const dynamic = "force-dynamic";

const itineraryEventSchema = z.object({
  sessionToken: z.string().max(128).optional().nullable(),
  idempotencyKey: z.string().max(128).optional(),
  eventType: z.enum([
    "builder_started",
    "preview_completed",
    "submitted",
    "retrieved",
    "downloaded",
  ]),
  stopCount: z.number().int().min(0).max(50).default(0),
  placeIds: z.array(z.string().uuid()).max(30).default([]),
});

export async function POST(req: Request) {
  try {
    const rl = checkRateLimit(getClientThrottleKey(req, "analytics_itin"), 60, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ recorded: false }, { status: 429 });
    }

    const body = await req.json();
    const parsed = itineraryEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid itinerary event." }, { status: 400 });
    }

    if (await isAdministrativeTraffic(req, "/app/trips")) {
      return NextResponse.json({ recorded: false, reason: "admin_excluded" });
    }

    const session = await resolveOrCreateAnonymousSession({
      req,
      providedSessionToken: parsed.data.sessionToken ?? undefined,
      entryPath: "/app/trips",
    });

    const db = await getDb();
    const inserted = await db
      .insert(schema.itineraryEvents)
      .values({
        sessionId: session.sessionId,
        idempotencyKey: parsed.data.idempotencyKey || generateRandomToken(12),
        eventType: parsed.data.eventType,
        stopCount: parsed.data.stopCount,
        placeIdsJson: parsed.data.placeIds,
      })
      .onConflictDoNothing({ target: schema.itineraryEvents.idempotencyKey })
      .returning({ id: schema.itineraryEvents.id });

    if (inserted.length > 0 && !session.isLikelyBot) {
      const today = new Date().toISOString().slice(0, 10);
      await incrementDailyAggregate(today, "itinerary_funnel", parsed.data.eventType, 1);
    }

    const res = NextResponse.json({
      recorded: inserted.length > 0,
      sessionToken: session.sessionToken,
    });
    res.cookies.set(VISITOR_SESSION_COOKIE, session.sessionToken, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err) {
    console.error("[POST /api/analytics/itinerary-event]", err);
    return NextResponse.json({ recorded: false }, { status: 500 });
  }
}
