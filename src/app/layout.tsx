import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/components/providers/QueryProvider";
import localFont from "next/font/local";
import "./globals.css";
import "./field-guide.css";
import "./visitor-guide.css";

const sans = localFont({
  src: "./fonts/dm-sans-latin-wght-normal.woff2",
  variable: "--guide-sans",
  weight: "100 1000",
  display: "swap",
});
const serif = localFont({
  src: [
    { path: "./fonts/newsreader-latin-standard-normal.woff2", weight: "200 800", style: "normal" },
    { path: "./fonts/newsreader-latin-standard-italic.woff2", weight: "200 800", style: "italic" },
  ],
  variable: "--guide-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Project CEDO: Turi — Salcedo, Ilocos Sur",
    template: "%s | Project CEDO: Turi",
  },
  description:
    "Project CEDO: Turi — Official Municipal Tourism Discovery, Visitor Information, and Itinerary App for the Municipality of Salcedo, Ilocos Sur, Philippines.",
  applicationName: "Project CEDO: Turi",
  icons: {
    icon: [
      { url: "/app/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/app/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/app/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Project CEDO: Turi",
  },
};

export const viewport: Viewport = {
  themeColor: "#FCFBF7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-PH" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-screen antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
