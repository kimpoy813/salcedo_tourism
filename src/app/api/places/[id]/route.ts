import { NextResponse } from "next/server";
import { getPublishedPlaceByIdOrSlug } from "@/lib/queries/public-tourism";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const place = await getPublishedPlaceByIdOrSlug(id);
    if (!place) {
      return NextResponse.json({ error: "Destination not found." }, { status: 404 });
    }
    return NextResponse.json({ place });
  } catch (err) {
    console.error("[GET /api/places/[id]]", err);
    return NextResponse.json({ error: "Failed to load destination." }, { status: 500 });
  }
}
