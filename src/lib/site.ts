const configuredUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();

function normalize(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Public origin used for canonicals, Open Graph images and the sitemap.
 *
 * Vercel exposes the stable production hostname as VERCEL_PROJECT_PRODUCTION_URL;
 * VERCEL_URL is the per-deployment hostname and is a useful preview fallback.
 * The localhost value only matters in development.
 */
export const SITE_URL = normalize(
  configuredUrl ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.VERCEL_ENV === "production"
          ? "https://salcedotourism.vercel.app"
          : "http://localhost:3000")
);

export const SITE_NAME = "Salcedo Tourism Guide";
export const SITE_DESCRIPTION =
  "Waterfalls, spring resorts and local food in the Buaya River valley — the official visitor guide to Salcedo, Ilocos Sur.";

export const DEFAULT_OG_IMAGE = {
  url: "/og/salcedo-guide.jpg",
  width: 1200,
  height: 630,
  alt: "Rice terraces and wooded hills in the Buaya River valley, Salcedo, Ilocos Sur",
};

export function pageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path,
}: {
  title: string;
  description?: string;
  path: string;
}) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website" as const,
      siteName: SITE_NAME,
      locale: "en_PH",
      url: path,
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
