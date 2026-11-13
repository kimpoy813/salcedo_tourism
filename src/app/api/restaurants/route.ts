import { NextResponse } from "next/server";
import { getPublishedPlaces } from "@/lib/queries/public-tourism";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const places = await getPublishedPlaces({
    type: "restaurant",
    barangaySlug: searchParams.get("barangay"),
    search: searchParams.get("q"),
    sort: searchParams.get("sort") === "name" ? "name" : "newest",
  });
  return NextResponse.json({ restaurants: places, count: places.length });
}
