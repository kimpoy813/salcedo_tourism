import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getPublishedPlaces } from "@/lib/queries/public-tourism";
import { TripsPlannerClient } from "@/components/app/TripsPlannerClient";

import { PageIntro } from "@/components/ui/FieldGuide";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "My trip notebook",
  description: "Build a day-by-day Salcedo itinerary, estimate travel time and keep it on this device.",
  path: "/app/trips",
});
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
      policyDoc?.content || "Collected solely by Salcedo CEDO for tourism planning under RA 10173.",
  };

  return (
    <div className="guide-wrap notebook-layout">
      <div className="inner-mast">
        <PageIntro
          title="My Salcedo trip"
          description="Choose your stops, put them in order, and keep a copy of your itinerary."
        />
      </div>
      <div className="trip-workspace">
        <Suspense
          fallback={
            <div className="surface-card p-6 text-xs text-[#616E69]">Loading trip planner...</div>
          }
        >
          <TripsPlannerClient availablePlaces={places} privacyNotice={privacyNotice} />
        </Suspense>
      </div>
    </div>
  );
}
