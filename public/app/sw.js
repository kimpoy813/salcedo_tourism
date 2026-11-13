const CACHE_VERSION = "turi-salcedo-v1";
const STATIC_SHELL = [
  "/app",
  "/app/discover",
  "/app/map",
  "/app/more",
  "/app/offline",
  "/app/icons/icon-192x192.png",
  "/app/icons/icon-512x512.png",
  "/images/salcedo/seal-of-salcedo.png",
  "/images/salcedo/hero-salcedo-valley.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_SHELL)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((oldKey) => caches.delete(oldKey))
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
  if (
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // Only cache and serve /app/* and public Salcedo static assets
  if (url.pathname.startsWith("/images/salcedo/") || url.pathname.startsWith("/app/icons/")) {
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

  if (url.pathname.startsWith("/app")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const offlineFallback = await caches.match("/app/offline");
          return offlineFallback || new Response("Offline — Turi Salcedo", { status: 503 });
        })
    );
  }
});
