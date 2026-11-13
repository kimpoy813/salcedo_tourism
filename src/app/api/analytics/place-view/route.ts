import { NextResponse } from "next/server";
import { z } from "zod";
import {
  VISITOR_SESSION_COOKIE,
  isAdministrativeTraffic,
  recordPlaceView,
  resolveOrCreateAnonymousSession,
} from "@/lib/analytics";
import { checkRateLimit, getClientThrottleKey } from "@/lib/rate-limit";
import { generateRandomToken } from "@/lib/crypto";

export const dynamic = "force-dynamic";

const placeViewSchema = z.object({
  sessionToken: z.string().max(128).optional().nullable(),
  idempotencyKey: z.string().max(128).optional(),
  placeId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const rl = checkRateLimit(getClientThrottleKey(req, "analytics_place"), 120, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ recorded: false, reason: "rate_limited" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = placeViewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Valid placeId is required." }, { status: 400 });
    }

    if (await isAdministrativeTraffic(req, "/app/places")) {
      return NextResponse.json({ recorded: false, reason: "admin_excluded" });
    }

    const session = await resolveOrCreateAnonymousSession({
      req,
      providedSessionToken: parsed.data.sessionToken ?? undefined,
      entryPath: "/app/discover",
    });

    const result = await recordPlaceView({
      sessionId: session.sessionId,
      placeId: parsed.data.placeId,
      idempotencyKey: parsed.data.idempotencyKey || generateRandomToken(12),
      isBot: session.isLikelyBot,
    });

    const res = NextResponse.json({
      ...result,
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
    console.error("[POST /api/analytics/place-view]", err);
    return NextResponse.json({ recorded: false }, { status: 500 });
  }
}
