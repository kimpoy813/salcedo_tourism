"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { FieldData, MappedPlace } from "@/lib/geo/atlas";
function subscribe(notify: () => void) {
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
}
export function useOnline() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
export function useFieldData() {
  const [data, setData] = useState<FieldData | null>(null),
    [failed, setFailed] = useState(false),
    [attempt, retry] = useState(0);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/app/maps/salcedo-field.geojson", { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw Error();
        const result = (await r.json()) as FieldData;
        if (
          result.type !== "FeatureCollection" ||
          !Array.isArray(result.features)
        )
          throw Error();
        if (!ctrl.signal.aborted) {
          setData(result);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setFailed(true);
      });
    return () => ctrl.abort();
  }, [attempt]);
  return {
    data,
    failed,
    retry: () => {
      setFailed(false);
      retry((n) => n + 1);
    },
  };
}
/** Uses public destination coordinates only. The GPS fix never leaves the browser. */
export function useTelemetry(
  online: boolean,
  full: boolean,
  place: MappedPlace | undefined,
) {
  const [weather, setWeather] = useState<{
    temperatureC: number;
    condition: string;
  } | null>(null);
  const [elev, setElev] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!online || !full) return;
    const ctrl = new AbortController();
    fetch("/api/geo/telemetry", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (
          !ctrl.signal.aborted &&
          typeof d?.weather?.temperatureC === "number"
        )
          setWeather(d.weather);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [online, full]);
  const elevation = place ? elev[place.id] : undefined;
  useEffect(() => {
    if (!online || !place || elevation !== undefined) return;
    const ctrl = new AbortController();
    fetch(`/api/geo/telemetry?lat=${place.latitude}&lng=${place.longitude}`, {
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!ctrl.signal.aborted && Number.isFinite(d?.elevationMeters))
          setElev((old) => ({ ...old, [place.id]: d.elevationMeters }));
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [place, elevation, online]);
  return { weather: online ? weather : null, elevation };
}
