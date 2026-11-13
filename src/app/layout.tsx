import type { Metadata, Viewport } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: {
    default: "Project CEDO: Turi App — Salcedo, Ilocos Sur",
    template: "%s | Project CEDO: Turi App",
  },
  description:
    "Official Municipal Tourism Discovery, Visitor Information, and Itinerary App for the Municipality of Salcedo, Ilocos Sur, Philippines.",
  applicationName: "Project CEDO: Turi App",
  icons: {
    icon: [
      { url: "/app/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/app/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/app/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Turi",
  },
};

export const viewport: Viewport = {
  themeColor: "#123F35",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8F7F2] text-[#202B28] antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
