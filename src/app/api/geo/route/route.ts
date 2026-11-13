import { NextResponse } from "next/server";
import { computeHaversineKm, type LatLngTuple } from "@/lib/geo/salcedo-boundary";

export const dynamic = "force-dynamic";

interface OsrmStep {
  name?: string;
  distance?: number;
  maneuver?: {
    type?: string;
    modifier?: string;
  };
}

function formatStepInstruction(step: OsrmStep): string {
  const mType = step.maneuver?.type || "continue";
  const mod = step.maneuver?.modifier ? ` ${step.maneuver.modifier}` : "";
  const road = step.name && step.name.trim() ? ` onto ${step.name}` : "";
  if (mType === "depart") return `Start${road || " toward destination"}`;
  if (mType === "arrive") return "Arrive at destination";
  return `${mType.charAt(0).toUpperCase() + mType.slice(1)}${mod}${road}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fromLat = Number(searchParams.get("fromLat"));
  const fromLng = Number(searchParams.get("fromLng"));
  const toLat = Number(searchParams.get("toLat"));
  const toLng = Number(searchParams.get("toLng"));
  const mode = searchParams.get("mode") === "foot" ? "foot" : "driving";

  if (
    !Number.isFinite(fromLat) ||
    !Number.isFinite(fromLng) ||
    !Number.isFinite(toLat) ||
    !Number.isFinite(toLng)
  ) {
    return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });
  }

  try {
    const profile = mode === "foot" ? "foot" : "driving";
    const url = `https://router.project-osrm.org/route/v1/${profile}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "ProjectCEDO-Turi/1.0 (Salcedo, Ilocos Sur Municipal Tourism App)",
      },
      signal: controller.signal,
      next: { revalidate: 1800 },
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = (await res.json()) as {
        code?: string;
        routes?: Array<{
          distance: number;
          duration: number;
          geometry?: { coordinates: Array<[number, number]> };
          legs?: Array<{ steps?: OsrmStep[] }>;
        }>;
      };

      const route = data.routes?.[0];
      if (data.code === "Ok" && route?.geometry?.coordinates?.length) {
        const coordinates: LatLngTuple[] = route.geometry.coordinates.map(([lng, lat]) => [
          lat,
          lng,
        ]);
        const steps = (route.legs?.[0]?.steps || [])
          .filter((s) => (s.distance ?? 0) > 15 || s.maneuver?.type === "arrive")
          .slice(0, 8)
          .map((s) => ({
            instruction: formatStepInstruction(s),
            distanceMeters: Math.round(s.distance ?? 0),
          }));

        return NextResponse.json({
          source: "osrm",
          mode,
          distanceMeters: Math.round(route.distance),
          durationSeconds: Math.round(route.duration),
          coordinates,
          steps,
        });
      }
    }
  } catch {
    // Fall back to estimated distance/line below
  }

  const straightKm = computeHaversineKm(fromLat, fromLng, toLat, toLng);
  const roadKm = straightKm * 1.28;
  const speedKmh = mode === "foot" ? 4.2 : 28;
  const durationSeconds = Math.max(60, Math.round((roadKm / speedKmh) * 3600));

  return NextResponse.json({
    source: "estimate",
    mode,
    distanceMeters: Math.round(roadKm * 1000),
    durationSeconds,
    coordinates: [
      [fromLat, fromLng],
      [toLat, toLng],
    ] as LatLngTuple[],
    steps: [],
  });
}
