import { NextResponse } from "next/server";
import { getPublishedArticlesAndGuides } from "@/lib/queries/public-tourism";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getPublishedArticlesAndGuides();
    return NextResponse.json({
      travelGuides: data.guides,
      emergencyContacts: data.contacts,
      collections: data.collections,
    });
  } catch (err) {
    console.error("[GET /api/travel-guides]", err);
    return NextResponse.json({ error: "Failed to load travel guides." }, { status: 500 });
  }
}
