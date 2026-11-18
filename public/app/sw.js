/* Only public guide content is cached. Submissions and all admin/API routes bypass this worker. */
const CACHE = "turi-salcedo-v4";
const SHELL = ["/app/", "/app/trips", "/app/offline", "/app/discover", "/app/map", "/app/more"];

// Collect only this build's public static resources; never store API payloads.
async function cachePage(cache, path, assets) {
  const response = await fetch(path, { cache: "reload" });
  if (!response.ok || !response.headers.get("content-type")?.includes("text/html"))
    throw new Error("Guide not ready");
  await cache.put(path, response.clone());
  const html = await response.text();
  for (const [, src] of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"<>]+)"/g))
    assets.add(src.replaceAll("&amp;", "&"));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const assets = new Set([
        "/app/icons/icon-192x192.png",
        "/app/icons/icon-512x512.png",
        "/images/salcedo/guide-valley.webp",
      ]);
      await Promise.all(SHELL.map((path) => cachePage(cache, path, assets)));
      await cache.addAll([...assets]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("message", (event) => {
  const path = event.data?.path;
  if (
    event.data?.type !== "keep-place" ||
    typeof path !== "string" ||
    !/^\/app\/places\/[a-z0-9_-]+$/i.test(path)
  )
    return;
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const assets = new Set();
      await cachePage(cache, path, assets);
      await Promise.all(
        [...assets].map(async (src) => {
          if (!(await cache.match(src))) await cache.add(src);
        }),
      );
    })().catch(() => undefined),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith("turi-salcedo-") && key !== CACHE) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || request.method !== "GET") return;
  const path = url.pathname;
  const asset =
    path.startsWith("/_next/static/") ||
    path.startsWith("/images/salcedo/") ||
    path.startsWith("/app/icons/") ||
    path === "/_next/image";
  if (asset) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) await cache.put(request, response.clone()).catch(() => undefined);
          return response;
        } catch {
          if (request.destination !== "image") return Response.error();
          // Do not cache this placeholder: the real photo loads when the connection returns.
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 150"><rect width="240" height="150" fill="#e9ebde"/><path d="m79 88 26-33 17 20 13-15 26 28H79Z" fill="none" stroke="#687664" stroke-width="2"/><text x="120" y="110" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#4d5c4d">Photo unavailable offline</text></svg>',
            { headers: { "Content-Type": "image/svg+xml" } },
          );
        }
      })(),
    );
    return;
  }
  // Never confuse a Next router/prefetch payload with an HTML navigation.
  if (request.mode !== "navigate" || !(path === "/app" || path.startsWith("/app/"))) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request);
        if (response.ok && response.headers.get("content-type")?.includes("text/html"))
          await cache.put(request, response.clone()).catch(() => undefined);
        return response;
      } catch {
        return (
          (await cache.match(request)) ||
          (await cache.match(path === "/app" ? "/app/" : path)) ||
          (await cache.match("/app/offline")) ||
          Response.error()
        );
      }
    })(),
  );
});
