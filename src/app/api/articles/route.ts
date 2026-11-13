import { NextResponse } from "next/server";
import { getPublishedArticlesAndGuides } from "@/lib/queries/public-tourism";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getPublishedArticlesAndGuides();
    return NextResponse.json({
      historicalArticles: data.historical,
      culturalArticles: data.cultural,
      announcements: data.announcements,
      municipalInformation: data.municipal,
    });
  } catch (err) {
    console.error("[GET /api/articles]", err);
    return NextResponse.json({ error: "Failed to load articles." }, { status: 500 });
  }
}
