import { NextResponse } from "next/server";
import { z } from "zod";
import {
  VISITOR_SESSION_COOKIE,
  isAdministrativeTraffic,
  resolveOrCreateAnonymousSession,
} from "@/lib/analytics";
import { checkRateLimit, getClientThrottleKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const sessionSchema = z.object({
  sessionToken: z.string().max(128).optional().nullable(),
  entryPath: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  try {
    const rl = checkRateLimit(getClientThrottleKey(req, "analytics_session"), 60, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ tracked: false, reason: "rate_limited" }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = sessionSchema.safeParse(body);
    const entryPath = parsed.success ? parsed.data.entryPath : "/app";
    const providedToken = parsed.success ? parsed.data.sessionToken ?? undefined : undefined;

    if (await isAdministrativeTraffic(req, entryPath)) {
      return NextResponse.json({ tracked: false, reason: "admin_excluded" });
    }

    const session = await resolveOrCreateAnonymousSession({
      req,
      providedSessionToken: providedToken,
      entryPath,
    });

    const res = NextResponse.json({
      tracked: !session.isLikelyBot,
      sessionToken: session.sessionToken,
      isNew: session.isNew,
    });

    res.cookies.set(VISITOR_SESSION_COOKIE, session.sessionToken, {
      httpOnly: false, // Allows client tracker to include token seamlessly in fetch calls; no PII inside
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (err) {
    console.error("[POST /api/analytics/session]", err);
    return NextResponse.json({ tracked: false }, { status: 500 });
  }
}
