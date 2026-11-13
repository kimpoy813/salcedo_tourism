import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { recordAuditLog, requireAdminApiAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiAuth("visitor.pii.delete");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const action = (body.action as "anonymize" | "delete") || "anonymize";
    const db = await getDb();

    const [sub] = await db
      .select()
      .from(schema.visitorSubmissions)
      .where(eq(schema.visitorSubmissions.id, id))
      .limit(1);

    if (!sub) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    if (action === "delete") {
      await db.delete(schema.itineraries).where(eq(schema.itineraries.id, sub.itineraryId));
      await recordAuditLog({
        principal: auth.principal,
        action: "visitor.pii.delete",
        targetType: "visitor_submission",
        targetId: id,
        summary: `Permanently deleted visitor submission & itinerary (${sub.itineraryId}) under RA 10173.`,
      });
      return NextResponse.json({ deleted: true });
    }

    // Anonymize personal identifiers while preserving de-identified municipality/province aggregates
    await db.transaction(async (tx) => {
      await tx
        .update(schema.visitorContactInformation)
        .set({
          visitorName: null,
          contactNumber: null,
          emailAddress: null,
          followUpConsentGiven: false,
          consentRecordedAt: null,
        })
        .where(eq(schema.visitorContactInformation.submissionId, id));

      await tx
        .update(schema.visitorSubmissions)
        .set({ anonymizedAt: new Date() })
        .where(eq(schema.visitorSubmissions.id, id));

      await tx
        .update(schema.itineraries)
        .set({ status: "anonymized", updatedAt: new Date() })
        .where(eq(schema.itineraries.id, sub.itineraryId));
    });

    await recordAuditLog({
      principal: auth.principal,
      action: "visitor.pii.anonymize",
      targetType: "visitor_submission",
      targetId: id,
      summary: `Anonymized contact PII for visitor submission ${id}.`,
    });

    return NextResponse.json({ anonymized: true });
  } catch (err) {
    console.error("[PATCH /api/admin/visitors/[id]]", err);
    return NextResponse.json({ error: "Failed to process retention action." }, { status: 500 });
  }
}
