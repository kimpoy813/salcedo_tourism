import { NextResponse } from "next/server";
import { getPublishedProducts } from "@/lib/queries/public-tourism";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await getPublishedProducts();
    return NextResponse.json({ products, count: products.length });
  } catch (err) {
    console.error("[GET /api/products]", err);
    return NextResponse.json({ error: "Failed to load local products." }, { status: 500 });
  }
}
