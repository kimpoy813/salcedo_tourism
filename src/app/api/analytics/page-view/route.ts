import { NextResponse } from "next/server";
import { z } from "zod";
import {
  VISITOR_SESSION_COOKIE,
  isAdministrativeTraffic,
  recordPageView,
  resolveOrCreateAnonymousSession,
} from "@/lib/analytics";
import { checkRateLimit, getClientThrottleKey } from "@/lib/rate-limit";
import { generateRandomToken } from "@/lib/crypto";

export const dynamic = "force-dynamic";

const pageViewSchema = z.object({
  sessionToken: z.string().max(128).optional().nullable(),
  idempotencyKey: z.string().max(128).optional(),
  path: z.string().min(1).max(250),
  pageType: z.string().min(1).max(80),
  entitySlug: z.string().max(120).optional().nullable(),
  referrerPath: z.string().max(250).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const rl = checkRateLimit(getClientThrottleKey(req, "analytics_pv"), 120, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ recorded: false, reason: "rate_limited" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = pageViewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid page view payload." }, { status: 400 });
    }

    if (await isAdministrativeTraffic(req, parsed.data.path)) {
      return NextResponse.json({ recorded: false, reason: "admin_excluded" });
    }

    const session = await resolveOrCreateAnonymousSession({
      req,
      providedSessionToken: parsed.data.sessionToken ?? undefined,
      entryPath: parsed.data.path,
    });

    const result = await recordPageView({
      sessionId: session.sessionId,
      idempotencyKey: parsed.data.idempotencyKey || generateRandomToken(12),
      path: parsed.data.path,
      pageType: parsed.data.pageType,
      entitySlug: parsed.data.entitySlug,
      referrerPath: parsed.data.referrerPath,
      isBot: session.isLikelyBot,
    });

    const res = NextResponse.json({
      recorded: result.recorded,
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
    console.error("[POST /api/analytics/page-view]", err);
    return NextResponse.json({ recorded: false }, { status: 500 });
  }
}
