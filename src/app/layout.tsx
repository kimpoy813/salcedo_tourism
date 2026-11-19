import type { Metadata, Viewport } from "next";
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { QueryProvider } from "@/components/providers/QueryProvider";
import localFont from "next/font/local";
import "./globals.css";
import "./field-guide.css";
import "./visitor-guide.css";
import "./office.css";

const sans = localFont({
  src: "./fonts/dm-sans-latin-wght-normal.woff2",
  variable: "--guide-sans",
  weight: "100 1000",
  display: "swap",
});
const serif = localFont({
  src: "./fonts/newsreader-latin-standard-normal.woff2",
  variable: "--guide-serif",
  weight: "200 800",
  display: "swap",
});
// Italic is only used for a few scientific names deep in the local guide. Loading
// it separately keeps 132 KB off every other page's critical path.
const serifItalic = localFont({
  src: "./fonts/newsreader-latin-standard-italic.woff2",
  variable: "--guide-serif-italic",
  weight: "200 800",
  style: "italic",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Project CEDO: Turi — Salcedo, Ilocos Sur",
    template: "%s | Project CEDO: Turi",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Project CEDO: Turi",
  alternates: { canonical: "/app" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_PH",
    url: "/app",
    title: "Salcedo Tourism Guide — Ilocos Sur",
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Salcedo Tourism Guide — Ilocos Sur",
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
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
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-PH" className={`${sans.variable} ${serif.variable} ${serifItalic.variable}`}>
      <body className="min-h-screen antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
