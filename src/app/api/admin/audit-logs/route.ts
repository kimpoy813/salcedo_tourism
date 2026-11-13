import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdminApiAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApiAuth("admin.audit.read");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const db = await getDb();
  const logs = await db
    .select()
    .from(schema.auditLogs)
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(150);

  return NextResponse.json({ logs });
}
