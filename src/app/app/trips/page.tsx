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
    <div className="px-4 pt-[max(20px,env(safe-area-inset-top))] pb-8 space-y-5">
      <header className="space-y-1.5">
        <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#1D7874]">
          <span className="h-px w-6 bg-[#B88A44]" aria-hidden="true" />
          Trip Planner
        </p>
        <h1 className="font-display text-[28px] leading-[1.1] font-bold text-[#1A2421]">
          My Salcedo Trip
        </h1>
        <p className="text-[13px] leading-relaxed text-[#616E69]">
          Build your day, enjoy Salcedo, then share how it went.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="surface-card p-6 text-xs text-[#616E69]">
            Loading trip planner...
          </div>
        }
      >
        <TripsPlannerClient availablePlaces={places} privacyNotice={privacyNotice} />
      </Suspense>
    </div>
  );
}
