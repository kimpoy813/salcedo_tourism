const CACHE_VERSION = "turi-salcedo-v3";
const STATIC_SHELL = [
  "/app",
  "/app/discover",
  "/app/map",
  "/app/trips",
  "/app/more",
  "/app/offline",
  "/app/icons/icon-192x192.png",
  "/app/icons/icon-512x512.png",
  "/images/salcedo/turi-logo.png",
  "/images/salcedo/seal-of-salcedo.png",
  "/images/salcedo/hero-salcedo-valley.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(STATIC_SHELL))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((oldKey) => caches.delete(oldKey))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // NEVER cache admin routes, API routes, visitor data, or itinerary submissions
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/")) {
    return;
  }

  // Immutable Next.js build assets: cache-first (hashed filenames)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // Salcedo images & icons: stale-while-revalidate so saved places show photos offline
  if (
    url.pathname.startsWith("/images/salcedo/") ||
    url.pathname.startsWith("/app/icons/") ||
    url.pathname.startsWith("/_next/image")
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkFetch = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // Tourist app pages (home, discover, map, trips, place details):
  // stale-while-revalidate — instant offline open from cache, refreshed in
  // the background when signal returns. Place pages a tourist opened are
  // therefore readable later in upland barangays with no signal.
  if (url.pathname.startsWith("/app")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkFetch = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(async () => {
            if (cached) return cached;
            const offlineFallback = await caches.match("/app/offline");
            return (
              offlineFallback ||
              new Response("Offline — Turi Salcedo", { status: 503 })
            );
          });
        return cached || networkFetch;
      })
    );
    return;
  }
});
