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

const searchEventSchema = z.object({
  sessionToken: z.string().max(128).optional().nullable(),
  idempotencyKey: z.string().max(128).optional(),
  query: z.string().trim().min(1).max(120),
  categoryFilter: z.string().max(80).optional().nullable(),
  barangayFilter: z.string().max(80).optional().nullable(),
  resultsCount: z.number().int().min(0).max(5000).default(0),
});

export async function POST(req: Request) {
  try {
    const rl = checkRateLimit(getClientThrottleKey(req, "analytics_search"), 60, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ recorded: false }, { status: 429 });
    }

    const body = await req.json();
    const parsed = searchEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid search event." }, { status: 400 });
    }

    if (await isAdministrativeTraffic(req, "/app/discover")) {
      return NextResponse.json({ recorded: false, reason: "admin_excluded" });
    }

    const session = await resolveOrCreateAnonymousSession({
      req,
      providedSessionToken: parsed.data.sessionToken ?? undefined,
      entryPath: "/app/discover",
    });

    const normalizedQuery = parsed.data.query.trim().toLowerCase().slice(0, 120);
    const db = await getDb();
    const inserted = await db
      .insert(schema.searchEvents)
      .values({
        sessionId: session.sessionId,
        idempotencyKey: parsed.data.idempotencyKey || generateRandomToken(12),
        normalizedQuery,
        categoryFilter: parsed.data.categoryFilter ?? null,
        barangayFilter: parsed.data.barangayFilter ?? null,
        resultsCount: parsed.data.resultsCount,
      })
      .onConflictDoNothing({ target: schema.searchEvents.idempotencyKey })
      .returning({ id: schema.searchEvents.id });

    if (inserted.length > 0 && !session.isLikelyBot) {
      const today = new Date().toISOString().slice(0, 10);
      await incrementDailyAggregate(today, "searches", normalizedQuery, 1);
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
    console.error("[POST /api/analytics/search-event]", err);
    return NextResponse.json({ recorded: false }, { status: 500 });
  }
}
