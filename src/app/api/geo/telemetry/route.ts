import { NextResponse } from "next/server";
import {
  findSalcedoBarangayForPoint,
  isInsideSalcedo,
  SALCEDO_TOWN_PLAZA_COORD,
} from "@/lib/geo/salcedo-boundary";

export const dynamic = "force-dynamic";

function describeWmoWeather(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 48) return "Misty";
  if (code <= 57) return "Drizzle";
  if (code <= 67 || (code >= 80 && code <= 82)) return "Rain";
  if (code >= 95) return "Thunderstorm";
  return "Fair";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawLat = searchParams.get("lat");
  const rawLng = searchParams.get("lng");

  const lat =
    rawLat !== null && Number.isFinite(Number(rawLat))
      ? Number(rawLat)
      : SALCEDO_TOWN_PLAZA_COORD[0];
  const lng =
    rawLng !== null && Number.isFinite(Number(rawLng))
      ? Number(rawLng)
      : SALCEDO_TOWN_PLAZA_COORD[1];

  const insideSalcedo = isInsideSalcedo(lat, lng);
  const barangay = insideSalcedo ? findSalcedoBarangayForPoint(lat, lng) : null;

  let weather: {
    temperatureC: number;
    condition: string;
    windKmh: number;
    source: string;
  } | null = null;
  let elevationMeters: number | null = null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const [weatherRes, elevRes] = await Promise.allSettled([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${SALCEDO_TOWN_PLAZA_COORD[0]}&longitude=${SALCEDO_TOWN_PLAZA_COORD[1]}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Asia%2FManila`,
        { signal: controller.signal, next: { revalidate: 900 } }
      ),
      fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`, {
        signal: controller.signal,
        next: { revalidate: 86400 },
      }),
    ]);
    clearTimeout(timer);

    if (weatherRes.status === "fulfilled" && weatherRes.value.ok) {
      const wJson = (await weatherRes.value.json()) as {
        current?: { temperature_2m?: number; weather_code?: number; wind_speed_10m?: number };
      };
      if (typeof wJson.current?.temperature_2m === "number") {
        weather = {
          temperatureC: Math.round(wJson.current.temperature_2m),
          condition: describeWmoWeather(wJson.current.weather_code ?? 1),
          windKmh: Math.round(wJson.current.wind_speed_10m ?? 0),
          source: "Open-Meteo",
        };
      }
    }

    if (elevRes.status === "fulfilled" && elevRes.value.ok) {
      const eJson = (await elevRes.value.json()) as { elevation?: number[] };
      if (typeof eJson.elevation?.[0] === "number") {
        elevationMeters = Math.round(eJson.elevation[0]);
      }
    }
  } catch {
    // Graceful fallback when offline
  }

  return NextResponse.json({
    insideSalcedo,
    barangay,
    elevationMeters,
    weather,
  });
}
