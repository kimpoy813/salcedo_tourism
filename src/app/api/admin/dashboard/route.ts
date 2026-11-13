import { NextResponse } from "next/server";
import { eq, gte, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdminApiAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApiAuth("analytics.read");
  // Content editors without analytics.read still get basic inventory overview if authenticated
  const fallbackAuth = auth.ok ? auth : await requireAdminApiAuth("content.edit");
  if (!fallbackAuth.ok) {
    return NextResponse.json({ error: fallbackAuth.message }, { status: fallbackAuth.status });
  }

  try {
    const db = await getDb();
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const fourteenDaysAgo = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);

    const [
      allPlaces,
      allBarangays,
      allEvents,
      allSessions,
      allPlaceViews,
      allSearchEvents,
      allItineraries,
      allSubmissions,
      allStops,
      allArrivalRecords,
    ] = await Promise.all([
      db.select().from(schema.places),
      db.select().from(schema.barangays),
      db.select().from(schema.events),
      db
        .select()
        .from(schema.anonymousSessions)
        .where(eq(schema.anonymousSessions.isLikelyBot, false)),
      db.select().from(schema.placeViewEvents),
      db.select().from(schema.searchEvents),
      db.select().from(schema.itineraries),
      db.select().from(schema.visitorSubmissions),
      db.select().from(schema.itineraryStops),
      db.select().from(schema.visitorArrivalRecords),
    ]);

    const publishedPlaces = allPlaces.filter((p) => p.status === "published" && !p.isPlaceholder);
    const inventory = {
      totalAttractions: publishedPlaces.filter((p) =>
        ["attraction", "nature", "heritage"].includes(p.placeType)
      ).length,
      totalCafes: publishedPlaces.filter((p) => p.placeType === "cafe").length,
      totalResorts: publishedPlaces.filter((p) => p.placeType === "resort").length,
      totalRestaurants: publishedPlaces.filter((p) => p.placeType === "restaurant").length,
      totalAccommodations: publishedPlaces.filter(
        (p) => p.placeType === "accommodation" || p.slug === "bakaan-farm-and-resort"
      ).length,
      totalBusinesses: publishedPlaces.filter((p) => p.placeType === "business").length,
      totalBarangays: allBarangays.length,
      upcomingEvents: allEvents.filter(
        (e) => e.status === "published" && e.startDate >= todayStr
      ).length,
      draftOrPendingPlaces: allPlaces.filter(
        (p) => p.status === "draft" || p.status === "pending_review"
      ).length,
    };

    // Digital Visit Metrics (strictly anonymous sessions & views, not physical arrivals)
    const sessionsToday = allSessions.filter(
      (s) => new Date(s.startedAt).getTime() >= startOfToday.getTime()
    ).length;
    const sessionsThisMonth = allSessions.filter(
      (s) => new Date(s.startedAt).getTime() >= monthStart.getTime()
    ).length;

    const placeById = new Map(allPlaces.map((p) => [p.id, p]));
    const placeViewCounts = new Map<string, number>();
    for (const pv of allPlaceViews) {
      placeViewCounts.set(pv.placeId, (placeViewCounts.get(pv.placeId) ?? 0) + 1);
    }

    const mostViewedPlaces = Array.from(placeViewCounts.entries())
      .map(([placeId, views]) => ({
        placeId,
        name: placeById.get(placeId)?.name || "Unknown Place",
        placeType: placeById.get(placeId)?.placeType || "attraction",
        views,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);

    const categoryViewsMap = new Map<string, number>();
    for (const [placeId, views] of placeViewCounts.entries()) {
      const pType = placeById.get(placeId)?.placeType || "other";
      categoryViewsMap.set(pType, (categoryViewsMap.get(pType) ?? 0) + views);
    }
    const popularCategories = Array.from(categoryViewsMap.entries()).map(([category, views]) => ({
      category,
      views,
    }));

    const searchCountMap = new Map<string, number>();
    for (const se of allSearchEvents) {
      searchCountMap.set(se.normalizedQuery, (searchCountMap.get(se.normalizedQuery) ?? 0) + 1);
    }
    const searchTrends = Array.from(searchCountMap.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 14-day daily trend chart
    const dailyMap = new Map<
      string,
      { date: string; appSessions: number; itineraries: number; verifiedArrivals: number }
    >();
    for (let i = 0; i < 14; i++) {
      const d = new Date(fourteenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const ds = d.toISOString().slice(0, 10);
      dailyMap.set(ds, { date: ds, appSessions: 0, itineraries: 0, verifiedArrivals: 0 });
    }
    for (const s of allSessions) {
      const ds = new Date(s.startedAt).toISOString().slice(0, 10);
      const row = dailyMap.get(ds);
      if (row) row.appSessions += 1;
    }
    for (const it of allItineraries) {
      const ds = new Date(it.createdAt).toISOString().slice(0, 10);
      const row = dailyMap.get(ds);
      if (row) row.itineraries += 1;
    }
    for (const ar of allArrivalRecords) {
      const ds = ar.arrivalDate;
      const row = dailyMap.get(ds);
      if (row) row.verifiedArrivals += ar.arrivalCount;
    }

    // Planned Tourism Activity (Itineraries & Submissions — NOT physical arrivals!)
    const activeSubmissions = allSubmissions.filter((s) => !s.anonymizedAt);
    const itinerariesSubmittedToday = allItineraries.filter(
      (i) => new Date(i.createdAt).getTime() >= startOfToday.getTime()
    ).length;
    const plannedTravelerCount = activeSubmissions.reduce((acc, s) => acc + s.travelerCount, 0);

    const plannedStopMap = new Map<string, number>();
    for (const st of allStops) {
      plannedStopMap.set(st.placeId, (plannedStopMap.get(st.placeId) ?? 0) + 1);
    }
    const popularPlannedDestinations = Array.from(plannedStopMap.entries())
      .map(([placeId, stops]) => ({
        placeId,
        name: placeById.get(placeId)?.name || "Unknown Place",
        stops,
      }))
      .sort((a, b) => b.stops - a.stops)
      .slice(0, 8);

    const provinceMap = new Map<string, { province: string; submissions: number; travelers: number }>();
    const purposeMap = new Map<string, number>();
    const groupSizeBuckets = { solo: 0, pair: 0, smallGroup: 0, largeGroup: 0 };

    for (const sub of activeSubmissions) {
      const prov = sub.originProvince || "Unspecified";
      const cur = provinceMap.get(prov) ?? { province: prov, submissions: 0, travelers: 0 };
      cur.submissions += 1;
      cur.travelers += sub.travelerCount;
      provinceMap.set(prov, cur);

      const purpose = sub.purposeOfVisit || "Not specified";
      purposeMap.set(purpose, (purposeMap.get(purpose) ?? 0) + 1);

      if (sub.travelerCount === 1) groupSizeBuckets.solo += 1;
      else if (sub.travelerCount === 2) groupSizeBuckets.pair += 1;
      else if (sub.travelerCount <= 5) groupSizeBuckets.smallGroup += 1;
      else groupSizeBuckets.largeGroup += 1;
    }

    const upcomingPlannedDates = activeSubmissions
      .filter((s) => s.plannedVisitDate >= todayStr)
      .reduce<Record<string, number>>((acc, s) => {
        acc[s.plannedVisitDate] = (acc[s.plannedVisitDate] ?? 0) + s.travelerCount;
        return acc;
      }, {});

    // Verified Physical Arrivals (strictly separate from app views & itineraries!)
    const verifiedPhysicalArrivalsTotal = allArrivalRecords.reduce(
      (acc, r) => acc + r.arrivalCount,
      0
    );
    const verifiedPhysicalArrivalsToday = allArrivalRecords
      .filter((r) => r.arrivalDate === todayStr)
      .reduce((acc, r) => acc + r.arrivalCount, 0);

    const arrivalsByPlaceMap = new Map<string, number>();
    for (const r of allArrivalRecords) {
      arrivalsByPlaceMap.set(
        r.placeId,
        (arrivalsByPlaceMap.get(r.placeId) ?? 0) + r.arrivalCount
      );
    }

    const recentPageViews = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.pageViewEvents)
      .where(gte(schema.pageViewEvents.viewedAt, monthStart));

    return NextResponse.json({
      inventory,
      digitalVisits: {
        metricDefinition:
          "Estimated anonymous PWA sessions (30-minute inactivity window, bots & admin sessions excluded). Not verified unique individuals or physical arrivals.",
        appVisitSessionsToday: sessionsToday,
        appVisitSessionsThisMonth: sessionsThisMonth,
        totalAppVisitSessions: allSessions.length,
        monthlyPageViews: recentPageViews[0]?.count ?? 0,
        placeDetailViews: allPlaceViews.length,
        mostViewedPlaces,
        popularCategories,
        searchTrends,
      },
      plannedTourism: {
        metricDefinition:
          "Self-reported travel plans and group sizes from submitted itineraries. Represents planned demand, not confirmed physical arrivals.",
        totalSubmittedItineraries: allItineraries.filter((i) => i.status === "submitted").length,
        itinerariesSubmittedToday,
        plannedTravelerCount,
        popularPlannedDestinations,
        upcomingPlannedDates: Object.entries(upcomingPlannedDates)
          .map(([date, plannedTravelers]) => ({ date, plannedTravelers }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 10),
        travelPurposes: Array.from(purposeMap.entries()).map(([purpose, count]) => ({
          purpose,
          count,
        })),
        visitorOriginsByProvince: Array.from(provinceMap.values()).sort(
          (a, b) => b.travelers - a.travelers
        ),
        groupSizes: [
          { bucket: "Solo (1)", count: groupSizeBuckets.solo },
          { bucket: "Pair (2)", count: groupSizeBuckets.pair },
          { bucket: "Small Group (3–5)", count: groupSizeBuckets.smallGroup },
          { bucket: "Large Group (6+)", count: groupSizeBuckets.largeGroup },
        ],
      },
      physicalArrivals: {
        metricDefinition:
          "Confirmed physical tourist arrivals recorded exclusively through authorized on-site check-in verification methods.",
        hasVerifiedDataSource: allArrivalRecords.length > 0,
        verifiedArrivalsTotal: verifiedPhysicalArrivalsTotal,
        verifiedArrivalsToday: verifiedPhysicalArrivalsToday,
        arrivalsByDestination: Array.from(arrivalsByPlaceMap.entries()).map(([placeId, count]) => ({
          placeId,
          name: placeById.get(placeId)?.name || "Unknown Destination",
          count,
        })),
      },
      dailyTrends: Array.from(dailyMap.values()),
    });
  } catch (err) {
    console.error("[GET /api/admin/dashboard]", err);
    return NextResponse.json({ error: "Failed to load dashboard metrics." }, { status: 500 });
  }
}
