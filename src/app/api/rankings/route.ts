import { NextResponse } from "next/server";
import { getCategoriesWithCounts, getPublishedPlaces } from "@/lib/queries/public-tourism";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [places, categories] = await Promise.all([
      getPublishedPlaces(),
      getCategoriesWithCounts(),
    ]);

    const mostVisited = [...places].sort(
      (a, b) => a.mostVisitedRank - b.mostVisitedRank
    );
    const topRated = [...places].sort((a, b) => a.topRatedRank - b.topRatedRank);

    const byCategory = categories
      .filter((cat) => cat.publishedCount > 0)
      .map((cat) => {
        const items = places
          .filter((p) => p.primaryCategory?.id === cat.id)
          .sort((a, b) => a.categoryRank - b.categoryRank);
        return {
          category: {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            groupType: cat.groupType,
          },
          places: items,
        };
      });

    return NextResponse.json({
      mostVisited,
      topRated,
      byCategory,
    });
  } catch (err) {
    console.error("[GET /api/rankings]", err);
    return NextResponse.json({ error: "Failed to load rankings." }, { status: 500 });
  }
}
