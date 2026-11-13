import { NextResponse } from "next/server";
import {
  getAllBarangaysWithCounts,
  getPublishedArticlesAndGuides,
  getPublishedEvents,
  getPublishedPlaces,
  getPublishedProducts,
} from "@/lib/queries/public-tourism";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const qLower = q.toLowerCase();

    const [places, barangays, products, events, articles] = await Promise.all([
      getPublishedPlaces({
        search: q || null,
        categorySlug: searchParams.get("category"),
        barangaySlug: searchParams.get("barangay"),
      }),
      getAllBarangaysWithCounts(),
      getPublishedProducts(),
      getPublishedEvents(),
      getPublishedArticlesAndGuides(),
    ]);

    const matchedBarangays = q
      ? barangays.filter(
          (b) =>
            b.name.toLowerCase().includes(qLower) || b.summary.toLowerCase().includes(qLower)
        )
      : barangays;

    const matchedProducts = q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(qLower) ||
            p.description.toLowerCase().includes(qLower)
        )
      : products;

    const matchedEvents = q
      ? events.filter(
          (e) =>
            e.title.toLowerCase().includes(qLower) ||
            e.description.toLowerCase().includes(qLower)
        )
      : events;

    const matchedArticles = q
      ? [...articles.historical, ...articles.cultural].filter(
          (a) =>
            a.title.toLowerCase().includes(qLower) ||
            a.summary.toLowerCase().includes(qLower)
        )
      : [...articles.historical, ...articles.cultural];

    return NextResponse.json({
      query: q,
      places,
      barangays: matchedBarangays,
      products: matchedProducts,
      events: matchedEvents,
      articles: matchedArticles,
      totalResults:
        places.length +
        matchedBarangays.length +
        matchedProducts.length +
        matchedEvents.length +
        matchedArticles.length,
    });
  } catch (err) {
    console.error("[GET /api/search]", err);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
