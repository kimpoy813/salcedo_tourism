import { NextResponse } from "next/server";
import { desc, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasPermission, recordAuditLog, requireAdminApiAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function csvEscape(val: unknown): string {
  const str = val === null || val === undefined ? "" : String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: Request) {
  const auth = await requireAdminApiAuth("visitor.export");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") === "json" ? "json" : "csv";
  const wantsContact = searchParams.get("includeContact") === "true";
  const canIncludePii = wantsContact && hasPermission(auth.principal, "visitor.pii.read");

  const db = await getDb();
  const submissions = await db
    .select()
    .from(schema.visitorSubmissions)
    .orderBy(desc(schema.visitorSubmissions.createdAt));

  const itineraryIds = submissions.map((s) => s.itineraryId);
  const submissionIds = submissions.map((s) => s.id);

  const [itineraries, contacts] = await Promise.all([
    itineraryIds.length
      ? db.select().from(schema.itineraries).where(inArray(schema.itineraries.id, itineraryIds))
      : [],
    canIncludePii && submissionIds.length
      ? db
          .select()
          .from(schema.visitorContactInformation)
          .where(inArray(schema.visitorContactInformation.submissionId, submissionIds))
      : [],
  ]);

  const itinMap = new Map(itineraries.map((i) => [i.id, i]));
  const contactMap = new Map(contacts.map((c) => [c.submissionId, c]));

  const rows = submissions.map((sub) => {
    const itin = itinMap.get(sub.itineraryId);
    const contact = canIncludePii ? contactMap.get(sub.id) : null;
    const base = {
      referenceNumber: itin?.referenceNumber ?? "",
      plannedVisitDate: sub.plannedVisitDate,
      originMunicipality: sub.originMunicipality,
      originProvince: sub.originProvince,
      originCountry: sub.originCountry,
      travelerCount: sub.travelerCount,
      purposeOfVisit: sub.purposeOfVisit ?? "",
      transportationType: sub.transportationType ?? "",
      lengthOfStay: sub.lengthOfStay ?? "",
      privacyNoticeVersion: sub.privacyNoticeVersion,
      anonymized: Boolean(sub.anonymizedAt),
      submittedAt: sub.createdAt.toISOString(),
    };
    if (!canIncludePii) return base;
    return {
      ...base,
      visitorName: contact?.visitorName ?? "",
      contactNumber: contact?.contactNumber ?? "",
      emailAddress: contact?.emailAddress ?? "",
      followUpConsentGiven: Boolean(contact?.followUpConsentGiven),
    };
  });

  await recordAuditLog({
    principal: auth.principal,
    action: "visitor.report.export",
    targetType: "visitor_submission",
    summary: `Exported ${rows.length} visitor records as ${format.toUpperCase()} (${
      canIncludePii ? "with authorized contact PII" : "de-identified"
    }).`,
  });

  if (format === "json") {
    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      deIdentified: !canIncludePii,
      records: rows,
    });
  }

  const headers = rows.length
    ? Object.keys(rows[0])
    : [
        "referenceNumber",
        "plannedVisitDate",
        "originMunicipality",
        "originProvince",
        "originCountry",
        "travelerCount",
        "purposeOfVisit",
      ];
  const csvLines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => csvEscape((r as Record<string, unknown>)[h])).join(",")),
  ];

  return new NextResponse(csvLines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="salcedo-visitor-plan-export-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
