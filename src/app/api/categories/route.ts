import { NextResponse } from "next/server";
import { getCategoriesWithCounts } from "@/lib/queries/public-tourism";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await getCategoriesWithCounts();
    return NextResponse.json({ categories });
  } catch (err) {
    console.error("[GET /api/categories]", err);
    return NextResponse.json({ error: "Failed to load categories." }, { status: 500 });
  }
}
