import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

// A conservative policy that still permits Next's inline bootstrap, Leaflet's
// inline positioning styles and the three raster tile providers. No framing
// directive is set because the sandbox preview renders the app inside an iframe.
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https: wss:${isProduction ? "" : " ws: http://localhost:*"}`,
  "worker-src 'self' blob:",
  "media-src 'self' blob: https:",
  "manifest-src 'self'",
  "form-action 'self'",
  // The sandbox preview embeds the app in an iframe; only the real production
  // deployment opts into anti-framing.
  ...(process.env.VERCEL_ENV === "production" ? ["frame-ancestors 'self'"] : []),
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const legacyPhotoRedirects = [
  "baluarte-falls.png",
  "gallery-cafe-tablea.jpg",
  "gallery-heritage-church.jpg",
  "gallery-ilocano-grill.jpg",
  "gallery-mountain-viewpoint.jpg",
  "gallery-resort-cottages.jpg",
  "gallery-waterfall-pool.jpg",
  "hero-salcedo-valley.png",
  "ilocos-sur-locator-map.jpg",
  "local-eatery-table.png",
  "plaza-heritage.png",
  "rambutan-cacao-harvest.png",
  "seal-of-salcedo.png",
  "spring-water-resort.png",
].map((file) => ({
  source: `/images/salcedo/${file}`,
  destination: `/images/salcedo/${file.replace(/\.(png|jpe?g)$/i, ".webp")}`,
  permanent: true,
}));

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  // Keep the installed home URL inside the /app/ service-worker scope.
  skipTrailingSlashRedirect: true,
  allowedDevOrigins: ["*.e2b.app"],
  serverExternalPackages: ["@electric-sql/pglite", "ws", "sharp"],
  async redirects() {
    // Existing database rows still point at the original photo masters. Serve
    // their compact WebP derivatives instead of the multi-megabyte originals.
    return legacyPhotoRedirects;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/app/sw.js",
        headers: [
          {
            key: "Service-Worker-Allowed",
            value: "/app/",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
      {
        source: "/app/manifest.webmanifest",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },
      {
        source: "/api/admin/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, private",
          },
        ],
      },
      {
        source: "/api/itineraries/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, private",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
