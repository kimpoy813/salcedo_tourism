import { Suspense } from "react";
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
    <div className="px-4 pt-[max(18px,env(safe-area-inset-top))] pb-6 space-y-4">
      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#616E69]">
          Planner
        </p>
        <h1 className="font-display text-2xl font-bold text-[#1A2421]">
          My Salcedo Trip
        </h1>
      </div>

      <Suspense
        fallback={
          <div className="rounded-2xl bg-white border border-[#EAE7E0] p-6 text-xs text-[#616E69]">
            Loading trip planner...
          </div>
        }
      >
        <TripsPlannerClient availablePlaces={places} privacyNotice={privacyNotice} />
      </Suspense>
    </div>
  );
}
