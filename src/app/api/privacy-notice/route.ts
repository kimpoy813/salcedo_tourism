import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const [doc, setting] = await Promise.all([
      db
        .select()
        .from(schema.municipalInformation)
        .where(eq(schema.municipalInformation.key, "privacy_policy_ra10173"))
        .limit(1)
        .then((r) => r[0] ?? null),
      db
        .select()
        .from(schema.systemSettings)
        .where(eq(schema.systemSettings.key, "privacy_policy"))
        .limit(1)
        .then((r) => r[0] ?? null),
    ]);

    const version =
      (setting?.valueJson?.version as string | undefined) ||
      (doc?.metadataJson?.version as string | undefined) ||
      "2026.1-RA10173";

    return NextResponse.json({
      policy: {
        version,
        title: doc?.title || "Salcedo Tourism Visitor Information Privacy Notice (RA 10173)",
        bodyMarkdown:
          doc?.content ||
          "Collected solely by the Municipality of Salcedo CEDO for tourism planning and de-identified visitor statistics under RA 10173.",
      },
    });
  } catch (err) {
    console.error("[GET /api/privacy-notice]", err);
    return NextResponse.json({ error: "Failed to load privacy notice." }, { status: 500 });
  }
}
