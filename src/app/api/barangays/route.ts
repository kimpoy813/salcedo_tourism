import { NextResponse } from "next/server";
import { getAllBarangaysWithCounts } from "@/lib/queries/public-tourism";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const barangays = await getAllBarangaysWithCounts();
    return NextResponse.json({ barangays, count: barangays.length });
  } catch (err) {
    console.error("[GET /api/barangays]", err);
    return NextResponse.json({ error: "Failed to load barangays." }, { status: 500 });
  }
}
