import { NextResponse } from "next/server";
import { and, eq, ilike, or } from "drizzle-orm";
import { getDb, schema } from "@/db";
import {
  findSalcedoBarangayForPoint,
  isInsideSalcedo,
  SALCEDO_BOUNDS,
} from "@/lib/geo/salcedo-boundary";

export const dynamic = "force-dynamic";

export interface GeoSearchItem {
  id: string;
  label: string;
  subtitle: string;
  kind: "place" | "barangay" | "osm";
  slug?: string;
  barangayName?: string | null;
  latitude: number;
  longitude: number;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (q.length < 2) {
    return NextResponse.json({ results: [], osmEnabled: true });
  }

  const results: GeoSearchItem[] = [];
  const seenKeys = new Set<string>();

  // 1. Local published Salcedo places & 21 barangays
  try {
    const db = await getDb();
    const pattern = `%${q}%`;
    const [matchedPlaces, matchedBrgys] = await Promise.all([
      db
        .select({
          id: schema.places.id,
          name: schema.places.name,
          slug: schema.places.slug,
          address: schema.places.address,
          latitude: schema.places.latitude,
          longitude: schema.places.longitude,
        })
        .from(schema.places)
        .where(
          and(
            eq(schema.places.status, "published"),
            eq(schema.places.isPlaceholder, false),
            or(ilike(schema.places.name, pattern), ilike(schema.places.address, pattern))
          )
        )
        .limit(6),
      db
        .select({
          id: schema.barangays.id,
          name: schema.barangays.name,
          slug: schema.barangays.slug,
          district: schema.barangays.district,
          latitude: schema.barangays.latitude,
          longitude: schema.barangays.longitude,
        })
        .from(schema.barangays)
        .where(ilike(schema.barangays.name, pattern))
        .limit(4),
    ]);

    for (const p of matchedPlaces) {
      if (p.latitude == null || p.longitude == null) continue;
      const brgy = findSalcedoBarangayForPoint(p.latitude, p.longitude);
      seenKeys.add(p.name.toLowerCase());
      results.push({
        id: `place-${p.id}`,
        label: p.name,
        subtitle: brgy ? `Brgy. ${brgy.name} • Directory Spot` : p.address,
        kind: "place",
        slug: p.slug,
        barangayName: brgy?.name ?? null,
        latitude: p.latitude,
        longitude: p.longitude,
      });
    }

    for (const b of matchedBrgys) {
      seenKeys.add(`brgy ${b.name.toLowerCase()}`);
      results.push({
        id: `brgy-${b.id}`,
        label: `Brgy. ${b.name}`,
        subtitle: `${b.district} • Salcedo Barangay`,
        kind: "barangay",
        slug: b.slug,
        barangayName: b.name,
        latitude: b.latitude,
        longitude: b.longitude,
      });
    }
  } catch {
    // Continue to OSM lookup even if DB search hits an edge issue
  }

  // 2. Live OpenStreetMap Nominatim query strictly bounded inside Salcedo
  let osmOk = false;
  try {
    const viewbox = `${SALCEDO_BOUNDS.west},${SALCEDO_BOUNDS.north},${SALCEDO_BOUNDS.east},${SALCEDO_BOUNDS.south}`;
    const url =
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        `${q}, Salcedo, Ilocos Sur`
      )}` + `&viewbox=${viewbox}&bounded=1&countrycodes=ph&addressdetails=1&limit=8`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "ProjectCEDO-Turi/1.0 (Salcedo, Ilocos Sur Municipal Tourism App)",
        Accept: "application/json",
      },
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    clearTimeout(timer);

    if (res.ok) {
      osmOk = true;
      const osmHits = (await res.json()) as Array<{
        place_id: number;
        display_name: string;
        name?: string;
        lat: string;
        lon: string;
        type?: string;
        class?: string;
      }>;

      for (const hit of osmHits) {
        const lat = Number(hit.lat);
        const lng = Number(hit.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        if (!isInsideSalcedo(lat, lng)) continue;

        const shortName =
          (hit.name && hit.name.trim()) ||
          hit.display_name.split(",")[0]?.trim() ||
          "Salcedo Landmark";
        if (seenKeys.has(shortName.toLowerCase())) continue;
        seenKeys.add(shortName.toLowerCase());

        const brgy = findSalcedoBarangayForPoint(lat, lng);
        const typeLabel = hit.type ? hit.type.replace(/_/g, " ") : "OSM Landmark";
        results.push({
          id: `osm-${hit.place_id}`,
          label: shortName,
          subtitle: `${brgy ? `Brgy. ${brgy.name} • ` : ""}${typeLabel} (OpenStreetMap)`,
          kind: "osm",
          barangayName: brgy?.name ?? null,
          latitude: lat,
          longitude: lng,
        });
      }
    }
  } catch {
    osmOk = false;
  }

  return NextResponse.json({
    results: results.slice(0, 10),
    osmEnabled: osmOk,
  });
}
