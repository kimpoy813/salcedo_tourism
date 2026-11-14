"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Building2, CalendarCheck2, MapPin, Route } from "lucide-react";

export interface DashboardMetrics {
  inventory: {
    totalAttractions: number;
    totalCafes: number;
    totalResorts: number;
    totalRestaurants: number;
    totalAccommodations: number;
    totalBusinesses: number;
    totalBarangays: number;
    upcomingEvents: number;
    draftOrPendingPlaces: number;
  };
  digitalVisits: {
    metricDefinition: string;
    appVisitSessionsToday: number;
    appVisitSessionsThisMonth: number;
    totalAppVisitSessions: number;
    monthlyPageViews: number;
    placeDetailViews: number;
    mostViewedPlaces: Array<{
      placeId: string;
      name: string;
      placeType: string;
      views: number;
    }>;
    popularCategories: Array<{ category: string; views: number }>;
    searchTrends: Array<{ query: string; count: number }>;
  };
  plannedTourism: {
    metricDefinition: string;
    totalSubmittedItineraries: number;
    tripsCompleted?: number;
    stopsVisited?: number;
    tripRatingsSubmitted?: number;
    itinerariesSubmittedToday: number;
    plannedTravelerCount: number;
    popularPlannedDestinations: Array<{ placeId: string; name: string; stops: number }>;
    upcomingPlannedDates: Array<{ date: string; plannedTravelers: number }>;
    travelPurposes: Array<{ purpose: string; count: number }>;
    visitorOriginsByProvince: Array<{
      province: string;
      submissions: number;
      travelers: number;
    }>;
    groupSizes: Array<{ bucket: string; count: number }>;
  };
  physicalArrivals: {
    metricDefinition: string;
    hasVerifiedDataSource: boolean;
    verifiedArrivalsTotal: number;
    verifiedArrivalsToday: number;
    arrivalsByDestination: Array<{ placeId: string; name: string; count: number }>;
  };
  dailyTrends: Array<{
    date: string;
    appSessions: number;
    itineraries: number;
    verifiedArrivals: number;
  }>;
}

export function AdminAnalyticsPanel({ data }: { data: DashboardMetrics }) {
  return (
    <div className="space-y-6">
      {/* Metric Integrity Note */}
      <div className="rounded-2xl bg-[#F3F2EE] p-3.5 text-xs text-[#1A2421]">
        <strong>Metric Separation:</strong> Digital App Sessions, Planned Travelers (from
        itineraries), and Verified Physical Arrivals (on-site check-ins) are tracked strictly
        separately.
      </div>

      {/* Inventory KPI Strip */}
      <section className="space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#616E69]">
          <Building2 className="w-3.5 h-3.5 text-[#164237]" />
          <span>Published Inventory</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            { label: "Attractions", val: data.inventory.totalAttractions },
            { label: "Resorts", val: data.inventory.totalResorts },
            { label: "Cafés", val: data.inventory.totalCafes },
            { label: "Restaurants", val: data.inventory.totalRestaurants },
            { label: "Barangays", val: data.inventory.totalBarangays },
            { label: "Draft / Review", val: data.inventory.draftOrPendingPlaces },
          ].map((k) => (
            <div
              key={k.label}
              className="bg-white rounded-2xl border border-[#EAE7E0] p-3.5 space-y-0.5"
            >
              <p className="text-[11px] text-[#616E69]">{k.label}</p>
              <p className="font-display text-xl font-bold text-[#1A2421] tabular-nums">
                {k.val}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Three Measurement Pillars */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#1D7874]">
                Digital Traffic
              </p>
              <h3 className="font-display text-base font-bold text-[#1A2421]">
                App Visit Sessions
              </h3>
            </div>
            <Activity className="w-4 h-4 text-[#1D7874]" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[#FAF9F6] p-2.5">
              <p className="text-[11px] text-[#616E69]">Today</p>
              <p className="font-display text-lg font-bold text-[#164237] tabular-nums">
                {data.digitalVisits.appVisitSessionsToday}
              </p>
            </div>
            <div className="rounded-xl bg-[#FAF9F6] p-2.5">
              <p className="text-[11px] text-[#616E69]">This Month</p>
              <p className="font-display text-lg font-bold text-[#164237] tabular-nums">
                {data.digitalVisits.appVisitSessionsThisMonth}
              </p>
            </div>
            <div className="rounded-xl bg-[#FAF9F6] p-2.5">
              <p className="text-[11px] text-[#616E69]">Place Views</p>
              <p className="font-display text-base font-bold text-[#1A2421] tabular-nums">
                {data.digitalVisits.placeDetailViews}
              </p>
            </div>
            <div className="rounded-xl bg-[#FAF9F6] p-2.5">
              <p className="text-[11px] text-[#616E69]">Page Views</p>
              <p className="font-display text-base font-bold text-[#1A2421] tabular-nums">
                {data.digitalVisits.monthlyPageViews}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-[#616E69] leading-relaxed">
            {data.digitalVisits.metricDefinition}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#B88A44]">
                Planned Demand
              </p>
              <h3 className="font-display text-base font-bold text-[#1A2421]">
                Submitted Itineraries
              </h3>
            </div>
            <Route className="w-4 h-4 text-[#B88A44]" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-[#FAF9F6] p-2.5">
              <p className="text-[11px] text-[#616E69]">Trips</p>
              <p className="font-display text-lg font-bold text-[#1A2421] tabular-nums">
                {data.plannedTourism.totalSubmittedItineraries}
              </p>
            </div>
            <div className="rounded-xl bg-[#FAF9F6] p-2.5">
              <p className="text-[11px] text-[#616E69]">Today</p>
              <p className="font-display text-lg font-bold text-[#1A2421] tabular-nums">
                {data.plannedTourism.itinerariesSubmittedToday}
              </p>
            </div>
            <div className="rounded-xl bg-[#FAF9F6] p-2.5">
              <p className="text-[11px] text-[#616E69]">Guests</p>
              <p className="font-display text-lg font-bold text-[#164237] tabular-nums">
                {data.plannedTourism.plannedTravelerCount}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-[#616E69] leading-relaxed">
            {data.plannedTourism.metricDefinition}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#164237]">
                On-Site Verification
              </p>
              <h3 className="font-display text-base font-bold text-[#1A2421]">
                Actual Tourist Visits
              </h3>
            </div>
            <CalendarCheck2 className="w-4 h-4 text-[#164237]" />
          </div>

          {data.physicalArrivals.hasVerifiedDataSource ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[#FAF9F6] p-2.5">
                <p className="text-[11px] text-[#616E69]">Verified Total</p>
                <p className="font-display text-lg font-bold text-[#164237] tabular-nums">
                  {data.physicalArrivals.verifiedArrivalsTotal}
                </p>
              </div>
              <div className="rounded-xl bg-[#FAF9F6] p-2.5">
                <p className="text-[11px] text-[#616E69]">Today</p>
                <p className="font-display text-lg font-bold text-[#164237] tabular-nums">
                  {data.physicalArrivals.verifiedArrivalsToday}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-[#FAF9F6] border border-[#EAE7E0] p-3 text-xs text-[#616E69] space-y-0.5">
              <p className="font-semibold text-[#1A2421]">
                0 Verified Arrivals Yet
              </p>
              <p className="text-[11px]">
                Counts remain zero until verified on-site check-ins are logged.
              </p>
            </div>
          )}

          <p className="text-[11px] text-[#616E69] leading-relaxed">
            {data.physicalArrivals.metricDefinition}
          </p>
        </div>
      </section>

      {/* 14-Day Trend */}
      <section className="bg-white rounded-2xl border border-[#EAE7E0] p-5 space-y-3">
        <div>
          <h3 className="font-display text-sm font-bold text-[#1A2421]">
            14-Day Activity Comparison
          </h3>
          <p className="text-xs text-[#616E69]">
            App sessions vs. submitted itineraries vs. verified check-ins
          </p>
        </div>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.dailyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAE7E0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#616E69" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#616E69" }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="appSessions"
                name="App Sessions"
                fill="#1D7874"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="itineraries"
                name="Itineraries"
                fill="#B88A44"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="verifiedArrivals"
                name="Verified Arrivals"
                fill="#164237"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Detailed Rankings */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-3">
          <h3 className="font-display text-sm font-bold text-[#1A2421]">
            Most Viewed Spots
          </h3>
          {data.digitalVisits.mostViewedPlaces.length === 0 ? (
            <p className="text-xs text-[#616E69]">No public place views recorded yet.</p>
          ) : (
            <ul className="divide-y divide-[#EAE7E0] text-xs">
              {data.digitalVisits.mostViewedPlaces.map((p) => (
                <li key={p.placeId} className="flex justify-between py-2 gap-2">
                  <span className="font-medium text-[#1A2421] truncate">{p.name}</span>
                  <span className="font-semibold text-[#1D7874] tabular-nums">
                    {p.views}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-3">
          <h3 className="font-display text-sm font-bold text-[#1A2421]">
            Top Planned Destinations
          </h3>
          {data.plannedTourism.popularPlannedDestinations.length === 0 ? (
            <p className="text-xs text-[#616E69]">No submitted stops yet.</p>
          ) : (
            <ul className="divide-y divide-[#EAE7E0] text-xs">
              {data.plannedTourism.popularPlannedDestinations.map((p) => (
                <li key={p.placeId} className="flex justify-between py-2 gap-2">
                  <span className="font-medium text-[#1A2421] truncate">{p.name}</span>
                  <span className="font-semibold text-[#164237] tabular-nums">
                    {p.stops} stops
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-3">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#1D7874]" />
            <h3 className="font-display text-sm font-bold text-[#1A2421]">
              Visitor Origins (De-Identified)
            </h3>
          </div>
          {data.plannedTourism.visitorOriginsByProvince.length === 0 ? (
            <p className="text-xs text-[#616E69]">No submitted trips yet.</p>
          ) : (
            <ul className="divide-y divide-[#EAE7E0] text-xs">
              {data.plannedTourism.visitorOriginsByProvince.map((o) => (
                <li key={o.province} className="flex justify-between py-2 gap-2">
                  <span className="font-medium text-[#1A2421]">{o.province}</span>
                  <span className="text-[#616E69] tabular-nums">
                    {o.submissions} trips • <strong className="text-[#1A2421]">{o.travelers}</strong> guests
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-3">
          <h3 className="font-display text-sm font-bold text-[#1A2421]">
            Search Trends &amp; Group Sizes
          </h3>
          <div className="space-y-3">
            {data.digitalVisits.searchTrends.length === 0 ? (
              <p className="text-xs text-[#616E69]">No search events yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {data.digitalVisits.searchTrends.map((st) => (
                  <span
                    key={st.query}
                    className="rounded-full bg-[#F3F2EE] px-2.5 py-1 text-[11px] font-medium text-[#1A2421]"
                  >
                    {st.query} ({st.count})
                  </span>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-[#EAE7E0] grid grid-cols-2 sm:grid-cols-4 gap-2">
              {data.plannedTourism.groupSizes.map((g) => (
                <div key={g.bucket} className="rounded-xl bg-[#FAF9F6] p-2 text-center">
                  <p className="text-[10px] text-[#616E69]">{g.bucket}</p>
                  <p className="font-bold text-sm text-[#164237] tabular-nums">{g.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
