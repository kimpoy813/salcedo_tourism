import { cookies } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "./admin-auth";
import { generateRandomToken } from "./crypto";

export const VISITOR_SESSION_COOKIE = "cedo_turi_sid";
const INACTIVITY_WINDOW_MS = 30 * 60 * 1000; // 30-minute inactivity window

const BOT_UA_PATTERN =
  /(googlebot|bingbot|yandexbot|duckduckbot|baiduspider|slurp|semrush|ahrefs|mj12bot|bytespider|petalbot|facebookexternalhit|twitterbot|slackbot)/i;

export function classifyDevice(userAgent: string | null): "mobile" | "tablet" | "desktop" | "unknown" {
  if (!userAgent) return "unknown";
  if (/ipad|tablet|playbook|silk|(android(?!.*mobi))/i.test(userAgent)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(userAgent)) return "mobile";
  if (/mozilla|chrome|safari|firefox|edge/i.test(userAgent)) return "desktop";
  return "unknown";
}

export function isLikelyBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BOT_UA_PATTERN.test(userAgent);
}

/**
 * Returns true if request carries an authenticated admin cookie or originates from /admin.
 * Ensures administrative activity never inflates public tourist analytics.
 */
export async function isAdministrativeTraffic(req: Request, path?: string): Promise<boolean> {
  if (path && path.startsWith("/admin")) return true;
  const referer = req.headers.get("referer") || "";
  if (referer.includes("/admin")) return true;

  try {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (adminCookie) {
      const verified = await verifyAdminToken(adminCookie);
      if (verified) return true;
    }
  } catch {
    // Ignore cookie read error outside request context
  }
  return false;
}

/**
 * Resolves or creates an anonymous session adhering to the 30-minute inactivity window.
 * Never persists raw IP addresses or device fingerprints.
 */
export async function resolveOrCreateAnonymousSession(params: {
  req: Request;
  providedSessionToken?: string;
  entryPath?: string;
}): Promise<{
  sessionId: string;
  sessionToken: string;
  isNew: boolean;
  isLikelyBot: boolean;
}> {
  const db = await getDb();
  const ua = params.req.headers.get("user-agent");
  const bot = isLikelyBot(ua);
  const cookieStore = await cookies();
  const candidateToken =
    params.providedSessionToken || cookieStore.get(VISITOR_SESSION_COOKIE)?.value;

  if (candidateToken) {
    const [existing] = await db
      .select()
      .from(schema.anonymousSessions)
      .where(eq(schema.anonymousSessions.sessionToken, candidateToken))
      .limit(1);

    if (existing) {
      const elapsed = Date.now() - new Date(existing.lastActivityAt).getTime();
      if (elapsed <= INACTIVITY_WINDOW_MS) {
        await db
          .update(schema.anonymousSessions)
          .set({ lastActivityAt: new Date() })
          .where(eq(schema.anonymousSessions.id, existing.id));
        return {
          sessionId: existing.id,
          sessionToken: existing.sessionToken,
          isNew: false,
          isLikelyBot: existing.isLikelyBot,
        };
      }
    }
  }

  // Create fresh session after inactivity window or first visit
  const newToken = generateRandomToken(24);
  const [created] = await db
    .insert(schema.anonymousSessions)
    .values({
      sessionToken: newToken,
      entryPath: (params.entryPath || "/app").slice(0, 200),
      deviceCategory: classifyDevice(ua),
      isLikelyBot: bot,
      pageViewsCount: 0,
    })
    .returning();

  // Increment daily aggregate for non-bot sessions
  if (!bot) {
    const today = new Date().toISOString().slice(0, 10);
    await incrementDailyAggregate(today, "app_sessions", "all", 1);
  }

  return {
    sessionId: created.id,
    sessionToken: created.sessionToken,
    isNew: true,
    isLikelyBot: bot,
  };
}

export async function incrementDailyAggregate(
  metricDate: string,
  metricKey: string,
  dimensionKey = "all",
  delta = 1
): Promise<void> {
  const db = await getDb();
  await db
    .insert(schema.analyticsDailyAggregates)
    .values({
      metricDate,
      metricKey,
      dimensionKey,
      countValue: delta,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        schema.analyticsDailyAggregates.metricDate,
        schema.analyticsDailyAggregates.metricKey,
        schema.analyticsDailyAggregates.dimensionKey,
      ],
      set: {
        countValue: sql`${schema.analyticsDailyAggregates.countValue} + ${delta}`,
        updatedAt: new Date(),
      },
    });
}

export async function recordPageView(params: {
  sessionId: string;
  idempotencyKey: string;
  path: string;
  pageType: string;
  entitySlug?: string | null;
  referrerPath?: string | null;
  isBot: boolean;
}): Promise<{ recorded: boolean }> {
  const db = await getDb();
  const inserted = await db
    .insert(schema.pageViewEvents)
    .values({
      sessionId: params.sessionId,
      idempotencyKey: params.idempotencyKey,
      path: params.path.slice(0, 250),
      pageType: params.pageType.slice(0, 80),
      entitySlug: params.entitySlug?.slice(0, 120) ?? null,
      referrerPath: params.referrerPath?.slice(0, 250) ?? null,
    })
    .onConflictDoNothing({ target: schema.pageViewEvents.idempotencyKey })
    .returning({ id: schema.pageViewEvents.id });

  if (inserted.length === 0) {
    return { recorded: false };
  }

  await db
    .update(schema.anonymousSessions)
    .set({
      pageViewsCount: sql`${schema.anonymousSessions.pageViewsCount} + 1`,
      lastActivityAt: new Date(),
    })
    .where(eq(schema.anonymousSessions.id, params.sessionId));

  if (!params.isBot) {
    const today = new Date().toISOString().slice(0, 10);
    await incrementDailyAggregate(today, "page_views", params.pageType, 1);
  }
  return { recorded: true };
}

export async function recordPlaceView(params: {
  sessionId: string;
  placeId: string;
  idempotencyKey: string;
  isBot: boolean;
}): Promise<{ recorded: boolean; deduplicated: boolean }> {
  const db = await getDb();
  // Verify place exists & is published
  const [place] = await db
    .select({ id: schema.places.id })
    .from(schema.places)
    .where(and(eq(schema.places.id, params.placeId), eq(schema.places.status, "published")))
    .limit(1);

  if (!place) {
    return { recorded: false, deduplicated: false };
  }

  // Unique constraint on (sessionId, placeId) prevents repeat inflation within the same session
  const inserted = await db
    .insert(schema.placeViewEvents)
    .values({
      sessionId: params.sessionId,
      placeId: params.placeId,
      idempotencyKey: params.idempotencyKey,
    })
    .onConflictDoNothing()
    .returning({ id: schema.placeViewEvents.id });

  if (inserted.length === 0) {
    return { recorded: false, deduplicated: true };
  }

  if (!params.isBot) {
    const today = new Date().toISOString().slice(0, 10);
    await incrementDailyAggregate(today, "place_views", params.placeId, 1);
  }
  return { recorded: true, deduplicated: false };
}
