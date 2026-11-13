import { NextResponse } from "next/server";
import { getPublishedEvents } from "@/lib/queries/public-tourism";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await getPublishedEvents();
    return NextResponse.json({ events, count: events.length });
  } catch (err) {
    console.error("[GET /api/events]", err);
    return NextResponse.json({ error: "Failed to load events." }, { status: 500 });
  }
}
