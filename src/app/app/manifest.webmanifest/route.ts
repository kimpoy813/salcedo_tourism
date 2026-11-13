import { NextResponse } from "next/server";

export async function GET() {
  const manifest = {
    id: "/app/",
    name: "Project CEDO: Turi App",
    short_name: "Turi",
    description:
      "Official Municipal Tourism Discovery, Visitor Information, and Itinerary App for Salcedo, Ilocos Sur, Philippines.",
    start_url: "/app/",
    scope: "/app/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F8F7F2",
    theme_color: "#123F35",
    lang: "en-PH",
    categories: ["travel", "navigation", "lifestyle"],
    icons: [
      {
        src: "/app/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/app/screenshots/mobile-home.png",
        sizes: "540x960",
        type: "image/png",
        form_factor: "narrow",
        label: "Project CEDO: Turi App — Salcedo Mobile Discovery",
      },
      {
        src: "/app/screenshots/desktop-discover.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Project CEDO: Turi App — Salcedo Map & Itinerary Planner",
      },
    ],
    shortcuts: [
      {
        name: "Discover Salcedo",
        short_name: "Discover",
        url: "/app/discover",
        icons: [{ src: "/app/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Interactive Map",
        short_name: "Map",
        url: "/app/map",
        icons: [{ src: "/app/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Plan My Trip",
        short_name: "My Trips",
        url: "/app/trips",
        icons: [{ src: "/app/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
