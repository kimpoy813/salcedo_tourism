import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { recordAuditLog, requireAdminApiAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApiAuth("admin.settings.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const db = await getDb();
  const [settings, policies] = await Promise.all([
    db.select().from(schema.systemSettings),
    db
      .select()
      .from(schema.municipalInformation)
      .where(eq(schema.municipalInformation.category, "privacy_policy")),
  ]);

  const privacySettings = settings
    .filter((s) => s.key !== "analytics_config")
    .map((s) => ({
      settingKey: s.key,
      settingValue: s.valueJson,
      description: s.description,
    }));
  const analyticsSettings = settings
    .filter((s) => s.key === "analytics_config")
    .map((s) => ({
      settingKey: s.key,
      settingValue: s.valueJson,
      description: s.description,
    }));

  return NextResponse.json({ privacySettings, analyticsSettings, policies });
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApiAuth("admin.settings.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { key, value } = body as {
      key: string;
      value: Record<string, unknown>;
    };

    const db = await getDb();
    await db
      .update(schema.systemSettings)
      .set({
        valueJson: value,
        updatedByAdminId: auth.principal.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.systemSettings.key, key));

    await recordAuditLog({
      principal: auth.principal,
      action: "settings.update",
      targetType: "system_setting",
      targetId: key,
      summary: `Updated system setting '${key}'.`,
    });

    return NextResponse.json({ updated: true });
  } catch (err) {
    console.error("[PATCH /api/admin/settings]", err);
    return NextResponse.json({ error: "Failed to update setting." }, { status: 500 });
  }
}
