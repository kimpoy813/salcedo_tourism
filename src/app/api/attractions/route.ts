import { NextResponse } from "next/server";
import { getPublishedPlaces } from "@/lib/queries/public-tourism";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const all = await getPublishedPlaces({
    barangaySlug: searchParams.get("barangay"),
    search: searchParams.get("q"),
    sort: searchParams.get("sort") === "name" ? "name" : "newest",
  });
  const attractions = all.filter((p) =>
    ["attraction", "nature", "heritage"].includes(p.placeType)
  );
  return NextResponse.json({ attractions, count: attractions.length });
}
