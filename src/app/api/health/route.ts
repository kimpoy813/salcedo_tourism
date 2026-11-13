import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({
      ok: true,
      app: "Project CEDO: Turi",
      municipality: "Salcedo, Ilocos Sur",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[GET /api/health]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
