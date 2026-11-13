import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getPublishedPlaces } from "@/lib/queries/public-tourism";
import { TripsPlannerClient } from "@/components/app/TripsPlannerClient";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const db = await getDb();
  const [places, policyDoc, policySetting] = await Promise.all([
    getPublishedPlaces(),
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
    (policySetting?.valueJson?.version as string | undefined) ||
    (policyDoc?.metadataJson?.version as string | undefined) ||
    "2026.1-RA10173";

  const privacyNotice = {
    version,
    title: policyDoc?.title || "Salcedo Tourism Visitor Information Privacy Notice (RA 10173)",
    bodyMarkdown:
      policyDoc?.content ||
      "Collected solely by Salcedo CEDO for tourism planning under RA 10173.",
  };

  return (
    <div className="px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-[#168A8A]">
          Account-Free Trip Planning
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#202B28]">
          My Salcedo Trips &amp; Itinerary Builder
        </h1>
        <p className="text-sm text-[#5A6B66] max-w-2xl">
          Draft, reorder, download, or print custom itineraries immediately without signing in.
          Submit only when ready to obtain your CEDO Reference Number &amp; Private Retrieval Code.
        </p>
      </div>

      <TripsPlannerClient availablePlaces={places} privacyNotice={privacyNotice} />
    </div>
  );
}
