import { NextResponse } from "next/server";
import { desc, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasPermission, recordAuditLog, requireAdminApiAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApiAuth("visitor.aggregate.read");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const canReadPii = hasPermission(auth.principal, "visitor.pii.read");
  const { searchParams } = new URL(req.url);
  const provinceFilter = searchParams.get("province")?.toLowerCase() || "";
  const purposeFilter = searchParams.get("purpose")?.toLowerCase() || "";
  const search = searchParams.get("q")?.toLowerCase() || "";

  const db = await getDb();
  const submissions = await db
    .select()
    .from(schema.visitorSubmissions)
    .orderBy(desc(schema.visitorSubmissions.createdAt));

  if (submissions.length === 0) {
    return NextResponse.json({
      canReadPii,
      canDeletePii: hasPermission(auth.principal, "visitor.pii.delete"),
      submissions: [],
    });
  }

  const itineraryIds = submissions.map((s) => s.itineraryId);
  const submissionIds = submissions.map((s) => s.id);

  const [itineraries, contacts, stops, places] = await Promise.all([
    db.select().from(schema.itineraries).where(inArray(schema.itineraries.id, itineraryIds)),
    canReadPii
      ? db
          .select()
          .from(schema.visitorContactInformation)
          .where(inArray(schema.visitorContactInformation.submissionId, submissionIds))
      : [],
    db
      .select()
      .from(schema.itineraryStops)
      .where(inArray(schema.itineraryStops.itineraryId, itineraryIds)),
    db.select({ id: schema.places.id, name: schema.places.name }).from(schema.places),
  ]);

  const itinMap = new Map(itineraries.map((i) => [i.id, i]));
  const contactMap = new Map(contacts.map((c) => [c.submissionId, c]));
  const placeNameMap = new Map(places.map((p) => [p.id, p.name]));
  const stopsMap = new Map<string, Array<{ placeName: string; stopOrder: number; visitTime: string | null }>>();
  for (const st of stops) {
    const arr = stopsMap.get(st.itineraryId) ?? [];
    arr.push({
      placeName: placeNameMap.get(st.placeId) || "Unknown Stop",
      stopOrder: st.stopOrder,
      visitTime: st.visitTime,
    });
    stopsMap.set(st.itineraryId, arr);
  }

  const rows = submissions
    .map((sub) => {
      const itin = itinMap.get(sub.itineraryId);
      const contact = canReadPii ? contactMap.get(sub.id) : null;
      return {
        id: sub.id,
        itineraryId: sub.itineraryId,
        referenceNumber: itin?.referenceNumber ?? "UNKNOWN",
        itineraryTitle: itin?.title ?? "Untitled",
        itineraryStatus: itin?.status ?? "submitted",
        originMunicipality: sub.originMunicipality,
        originProvince: sub.originProvince,
        originCountry: sub.originCountry,
        plannedVisitDate: sub.plannedVisitDate,
        travelerCount: sub.travelerCount,
        purposeOfVisit: sub.purposeOfVisit,
        transportationType: sub.transportationType,
        lengthOfStay: sub.lengthOfStay,
        discoverySource: sub.discoverySource,
        preferredExperience: sub.preferredExperience,
        privacyNoticeVersion: sub.privacyNoticeVersion,
        retentionExpiresAt: sub.retentionExpiresAt,
        anonymizedAt: sub.anonymizedAt,
        createdAt: sub.createdAt,
        stops: (stopsMap.get(sub.itineraryId) ?? []).sort((a, b) => a.stopOrder - b.stopOrder),
        // PII strictly gated behind visitor.pii.read
        piiRestricted: !canReadPii,
        contact: canReadPii
          ? {
              visitorName: contact?.visitorName ?? null,
              contactNumber: contact?.contactNumber ?? null,
              emailAddress: contact?.emailAddress ?? null,
              followUpConsentGiven: contact?.followUpConsentGiven ?? false,
            }
          : null,
      };
    })
    .filter((row) => {
      if (provinceFilter && !row.originProvince.toLowerCase().includes(provinceFilter)) {
        return false;
      }
      if (purposeFilter && !(row.purposeOfVisit || "").toLowerCase().includes(purposeFilter)) {
        return false;
      }
      if (search) {
        const hay = `${row.referenceNumber} ${row.itineraryTitle} ${row.originMunicipality} ${row.originProvince} ${row.contact?.visitorName ?? ""}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });

  if (canReadPii) {
    await recordAuditLog({
      principal: auth.principal,
      action: "visitor.submissions.view_pii",
      targetType: "visitor_submission",
      summary: `Viewed ${rows.length} visitor submissions (authorized PII access).`,
    });
  }

  return NextResponse.json({
    canReadPii,
    canDeletePii: hasPermission(auth.principal, "visitor.pii.delete"),
    submissions: rows,
  });
}
