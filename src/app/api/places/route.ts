import { NextResponse } from "next/server";
import { getPublishedPlaces } from "@/lib/queries/public-tourism";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sortParam = searchParams.get("sort");
    const sort =
      sortParam === "name"
        ? "name"
        : sortParam === "most_visited"
        ? "most_visited"
        : sortParam === "top_rated"
        ? "top_rated"
        : sortParam === "featured"
        ? "featured"
        : "newest";

    const places = await getPublishedPlaces({
      type: searchParams.get("type"),
      categorySlug: searchParams.get("category"),
      barangaySlug: searchParams.get("barangay"),
      search: searchParams.get("q") || searchParams.get("search"),
      featuredOnly: searchParams.get("featured") === "true",
      hiddenGemOnly: searchParams.get("hiddenGem") === "true",
      sort,
    });

    return NextResponse.json({ places, count: places.length });
  } catch (err) {
    console.error("[GET /api/places]", err);
    return NextResponse.json({ error: "Failed to load places." }, { status: 500 });
  }
}
