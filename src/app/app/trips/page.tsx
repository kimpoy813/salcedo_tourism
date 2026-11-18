import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getPublishedPlaces } from "@/lib/queries/public-tourism";
import { TripsPlannerClient } from "@/components/app/TripsPlannerClient";

import { GuideBanner } from "@/components/ui/GuideBanner";

export const metadata = { title: "My trip notebook" };
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
    <>
      <GuideBanner
        eyebrow="Your travel notebook"
        title="My Salcedo trip"
        description="Save the places you love and build an itinerary at your own pace."
        image="/images/salcedo/gallery-mountain-viewpoint.jpg"
        note="Mount Madarang · Ilocos Sur"
      />
      <div className="guide-wrap trip-workspace">
        <Suspense
          fallback={
            <div className="surface-card p-6 text-xs text-[#616E69]">Loading trip planner...</div>
          }
        >
          <TripsPlannerClient availablePlaces={places} privacyNotice={privacyNotice} />
        </Suspense>
      </div>
    </>
  );
}
