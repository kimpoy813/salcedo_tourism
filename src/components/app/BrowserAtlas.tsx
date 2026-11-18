"use client";
import dynamic from "next/dynamic";

// Leaflet requires the DOM. Include its module in the precached route assets
// so either map can open offline without first visiting that view online.
export const BrowserAtlas = dynamic(
  () =>
    import(/* webpackMode: "eager" */ "./SalcedoMap").then((m) => m.SalcedoMap),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        className="grid h-full min-h-40 place-items-center bg-[#eeefe3] text-sm text-[#4c624e]"
      >
        Opening the Salcedo field map…
      </div>
    ),
  },
);
