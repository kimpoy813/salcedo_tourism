/** App Router navigations fetch a component payload, not an offline-readable HTML page. */
export function keepPlaceOffline(path: string) {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator) || !navigator.onLine)
    return;
  void navigator.serviceWorker.ready
    .then((registration) => {
      registration.active?.postMessage({ type: "keep-place", path });
    })
    .catch(() => undefined);
}
