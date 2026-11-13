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
import {
  Activity,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  Eye,
  MapPin,
  Route,
  Users,
} from "lucide-react";

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
    mostViewedPlaces: Array<{ placeId: string; name: string; placeType: string; views: number }>;
    popularCategories: Array<{ category: string; views: number }>;
    searchTrends: Array<{ query: string; count: number }>;
  };
  plannedTourism: {
    metricDefinition: string;
    totalSubmittedItineraries: number;
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
    <div className="space-y-8">
      {/* 1. Strict 4-Category Metric Separation Notice */}
      <div className="rounded-2xl bg-[#123F35]/6 border border-[#123F35]/20 p-4 text-xs text-[#202B28] leading-relaxed">
        <strong>Municipal Reporting Integrity:</strong> Digital App Visit Sessions, Planned
        Traveler Counts (from itineraries), and Verified Physical Tourist Arrivals (on-site
        verification check-ins) are tracked and displayed strictly separately.
      </div>

      {/* Group A: Tourism Inventory */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#123F35]" />
          <h2 className="font-display text-lg font-bold text-[#202B28]">
            Tourism Inventory (Published Salcedo Records)
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
              className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-1"
            >
              <p className="text-xs font-medium text-[#5A6B66]">{k.label}</p>
              <p className="font-display text-2xl font-bold text-[#202B28] tabular-nums">
                {k.val}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Group B, C, D: Strictly Separated Visitor Measurement Pillars */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Digital Visits */}
        <div className="bg-white rounded-3xl border border-[#E5E0D5] p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#168A8A]/12 text-[#168A8A] px-2.5 py-0.5 text-[11px] font-bold">
                <Activity className="w-3 h-3" /> Estimated Digital Traffic
              </span>
              <h3 className="font-display text-lg font-bold text-[#202B28] mt-1">
                App Visit Sessions
              </h3>
            </div>
            <Eye className="w-5 h-5 text-[#168A8A]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#F8F7F2] p-3">
              <p className="text-[11px] text-[#5A6B66]">Sessions Today</p>
              <p className="font-display text-2xl font-bold text-[#123F35] tabular-nums">
                {data.digitalVisits.appVisitSessionsToday}
              </p>
            </div>
            <div className="rounded-2xl bg-[#F8F7F2] p-3">
              <p className="text-[11px] text-[#5A6B66]">This Month</p>
              <p className="font-display text-2xl font-bold text-[#123F35] tabular-nums">
                {data.digitalVisits.appVisitSessionsThisMonth}
              </p>
            </div>
            <div className="rounded-2xl bg-[#F8F7F2] p-3">
              <p className="text-[11px] text-[#5A6B66]">Place Views</p>
              <p className="font-display text-xl font-bold text-[#202B28] tabular-nums">
                {data.digitalVisits.placeDetailViews}
              </p>
            </div>
            <div className="rounded-2xl bg-[#F8F7F2] p-3">
              <p className="text-[11px] text-[#5A6B66]">Page Views (Mo.)</p>
              <p className="font-display text-xl font-bold text-[#202B28] tabular-nums">
                {data.digitalVisits.monthlyPageViews}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-[#5A6B66] leading-relaxed">
            {data.digitalVisits.metricDefinition}
          </p>
        </div>

        {/* Planned Tourism Activity */}
        <div className="bg-white rounded-3xl border border-[#E5E0D5] p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#D6A85B]/20 text-[#8C611B] px-2.5 py-0.5 text-[11px] font-bold">
                <Route className="w-3 h-3" /> Planned Travel Demand
              </span>
              <h3 className="font-display text-lg font-bold text-[#202B28] mt-1">
                Submitted Itineraries
              </h3>
            </div>
            <Users className="w-5 h-5 text-[#D6A85B]" />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-2xl bg-[#F8F7F2] p-3">
              <p className="text-[11px] text-[#5A6B66]">Total Trips</p>
              <p className="font-display text-2xl font-bold text-[#202B28] tabular-nums">
                {data.plannedTourism.totalSubmittedItineraries}
              </p>
            </div>
            <div className="rounded-2xl bg-[#F8F7F2] p-3">
              <p className="text-[11px] text-[#5A6B66]">Today</p>
              <p className="font-display text-2xl font-bold text-[#202B28] tabular-nums">
                {data.plannedTourism.itinerariesSubmittedToday}
              </p>
            </div>
            <div className="rounded-2xl bg-[#F8F7F2] p-3">
              <p className="text-[11px] text-[#5A6B66]">Travelers</p>
              <p className="font-display text-2xl font-bold text-[#123F35] tabular-nums">
                {data.plannedTourism.plannedTravelerCount}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-[#5A6B66] leading-relaxed">
            {data.plannedTourism.metricDefinition}
          </p>
        </div>

        {/* Verified Physical Arrivals */}
        <div className="bg-white rounded-3xl border-2 border-[#123F35]/25 p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-900 px-2.5 py-0.5 text-[11px] font-bold">
                <CheckCircle2 className="w-3 h-3" /> On-Site Verification Only
              </span>
              <h3 className="font-display text-lg font-bold text-[#202B28] mt-1">
                Actual Tourist Visits
              </h3>
            </div>
            <CalendarCheck2 className="w-5 h-5 text-emerald-700" />
          </div>

          {data.physicalArrivals.hasVerifiedDataSource ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3">
                <p className="text-[11px] text-emerald-800">Verified Total</p>
                <p className="font-display text-2xl font-bold text-emerald-900 tabular-nums">
                  {data.physicalArrivals.verifiedArrivalsTotal}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3">
                <p className="text-[11px] text-emerald-800">Verified Today</p>
                <p className="font-display text-2xl font-bold text-emerald-900 tabular-nums">
                  {data.physicalArrivals.verifiedArrivalsToday}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#F8F7F2] border border-[#E5E0D5] p-4 text-xs text-[#5A6B66] space-y-1">
              <p className="font-bold text-[#202B28]">
                0 Verified On-Site Arrivals Recorded Yet
              </p>
              <p>
                Physical arrival counts remain strictly zero until municipal staff or verified
                on-site destination check-ins are logged in the On-Site Check-in tab.
              </p>
            </div>
          )}

          <p className="text-[11px] text-[#5A6B66] leading-relaxed">
            {data.physicalArrivals.metricDefinition}
          </p>
        </div>
      </section>

      {/* Recharts 14-Day Comparison Chart */}
      <section className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-4">
        <div>
          <h3 className="font-display text-lg font-bold text-[#202B28]">
            14-Day Digital Activity vs. Planned Trips vs. Verified Arrivals
          </h3>
          <p className="text-xs text-[#5A6B66]">
            Live metrics queried from PostgreSQL daily activity records
          </p>
        </div>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.dailyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D5" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5A6B66" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#5A6B66" }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="appSessions" name="App Visit Sessions" fill="#168A8A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="itineraries" name="Submitted Itineraries" fill="#D6A85B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="verifiedArrivals" name="Verified Physical Arrivals" fill="#123F35" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Breakdown Grid: Popular Places, Planned Destinations, Origins, Search Queries */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-4">
          <h3 className="font-display text-lg font-bold text-[#202B28]">
            Most Viewed Places (Digital Interest)
          </h3>
          {data.digitalVisits.mostViewedPlaces.length === 0 ? (
            <p className="text-sm text-[#5A6B66]">
              No public place views recorded yet. Open destinations in /app to track views.
            </p>
          ) : (
            <div className="space-y-2.5">
              {data.digitalVisits.mostViewedPlaces.map((p) => (
                <div
                  key={p.placeId}
                  className="flex items-center justify-between rounded-xl bg-[#F8F7F2] px-3.5 py-2.5 text-sm"
                >
                  <span className="font-semibold text-[#202B28] truncate">{p.name}</span>
                  <span className="font-bold text-[#168A8A] tabular-nums">{p.views} views</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-4">
          <h3 className="font-display text-lg font-bold text-[#202B28]">
            Top Planned Destinations (Submitted Itineraries)
          </h3>
          {data.plannedTourism.popularPlannedDestinations.length === 0 ? (
            <p className="text-sm text-[#5A6B66]">No submitted itinerary stops yet.</p>
          ) : (
            <div className="space-y-2.5">
              {data.plannedTourism.popularPlannedDestinations.map((p) => (
                <div
                  key={p.placeId}
                  className="flex items-center justify-between rounded-xl bg-[#F8F7F2] px-3.5 py-2.5 text-sm"
                >
                  <span className="font-semibold text-[#202B28] truncate">{p.name}</span>
                  <span className="font-bold text-[#123F35] tabular-nums">{p.stops} stops</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#168A8A]" />
            <h3 className="font-display text-lg font-bold text-[#202B28]">
              Visitor Origins by Province (De-Identified)
            </h3>
          </div>
          {data.plannedTourism.visitorOriginsByProvince.length === 0 ? (
            <p className="text-sm text-[#5A6B66]">No submitted travel plans yet.</p>
          ) : (
            <div className="space-y-2">
              {data.plannedTourism.visitorOriginsByProvince.map((o) => (
                <div
                  key={o.province}
                  className="flex items-center justify-between rounded-xl bg-[#F8F7F2] px-3.5 py-2 text-sm"
                >
                  <span className="font-semibold text-[#202B28]">{o.province}</span>
                  <span className="text-xs text-[#5A6B66] tabular-nums">
                    {o.submissions} trip(s) • <strong>{o.travelers}</strong> planned travelers
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-4">
          <h3 className="font-display text-lg font-bold text-[#202B28]">
            Search Trends &amp; Group Size Distribution
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#5A6B66] mb-1.5">
                Recent Search Terms
              </p>
              {data.digitalVisits.searchTrends.length === 0 ? (
                <p className="text-xs text-[#5A6B66]">No search events yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {data.digitalVisits.searchTrends.map((st) => (
                    <span
                      key={st.query}
                      className="rounded-full bg-[#F8F7F2] border border-[#E5E0D5] px-3 py-1 text-xs font-semibold text-[#202B28]"
                    >
                      {st.query} ({st.count})
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#E5E0D5]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#5A6B66] mb-1.5">
                Planned Group Sizes
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {data.plannedTourism.groupSizes.map((g) => (
                  <div
                    key={g.bucket}
                    className="rounded-xl bg-[#F8F7F2] p-2.5 text-center border border-[#E5E0D5]"
                  >
                    <p className="text-[11px] text-[#5A6B66]">{g.bucket}</p>
                    <p className="font-bold text-base text-[#123F35] tabular-nums">{g.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
