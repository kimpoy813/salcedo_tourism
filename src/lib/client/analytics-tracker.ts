"use client";

const SESSION_KEY = "cedo_turi_client_sid";

export function getStoredVisitorSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function storeVisitorSessionToken(token?: string | null) {
  if (!token || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, token);
  } catch {
    // ignore
  }
}

function makeKey(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${rand}`;
}

export async function trackPageView(params: {
  path: string;
  pageType: string;
  entitySlug?: string | null;
}) {
  try {
    const res = await fetch("/api/analytics/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionToken: getStoredVisitorSessionToken(),
        idempotencyKey: makeKey(`pv-${params.path}`),
        path: params.path,
        pageType: params.pageType,
        entitySlug: params.entitySlug ?? null,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      storeVisitorSessionToken(data.sessionToken);
    }
  } catch {
    // Analytics must never interrupt tourist UX
  }
}

export async function trackPlaceView(placeId: string) {
  try {
    const res = await fetch("/api/analytics/place-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionToken: getStoredVisitorSessionToken(),
        idempotencyKey: makeKey(`place-${placeId}`),
        placeId,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      storeVisitorSessionToken(data.sessionToken);
    }
  } catch {
    // ignore
  }
}

export async function trackSearchEvent(params: {
  query: string;
  categoryFilter?: string | null;
  barangayFilter?: string | null;
  resultsCount: number;
}) {
  if (!params.query.trim()) return;
  try {
    const res = await fetch("/api/analytics/search-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionToken: getStoredVisitorSessionToken(),
        idempotencyKey: makeKey("search"),
        ...params,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      storeVisitorSessionToken(data.sessionToken);
    }
  } catch {
    // ignore
  }
}

export async function trackItineraryEvent(params: {
  eventType:
    | "builder_started"
    | "preview_completed"
    | "submitted"
    | "retrieved"
    | "downloaded";
  stopCount?: number;
  placeIds?: string[];
}) {
  try {
    const res = await fetch("/api/analytics/itinerary-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionToken: getStoredVisitorSessionToken(),
        idempotencyKey: makeKey(`itin-${params.eventType}`),
        eventType: params.eventType,
        stopCount: params.stopCount ?? 0,
        placeIds: params.placeIds ?? [],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      storeVisitorSessionToken(data.sessionToken);
    }
  } catch {
    // ignore
  }
}
