import type { MetadataRoute } from "next";
import { getPublishedPlaces } from "@/lib/queries/public-tourism";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const staticRoutes: Array<{ path: string; priority: number }> = [
  { path: "/app", priority: 1 },
  { path: "/app/discover", priority: 0.9 },
  { path: "/app/map", priority: 0.8 },
  { path: "/app/trips", priority: 0.7 },
  { path: "/app/salcedo", priority: 0.7 },
  { path: "/app/more", priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    changeFrequency: route.priority >= 0.9 ? "weekly" : "monthly",
    priority: route.priority,
  }));

  try {
    const places = await getPublishedPlaces({ sort: "most_visited", limit: 500 });
    for (const place of places) {
      entries.push({
        url: absoluteUrl(`/app/places/${place.slug}`),
        lastModified: place.verificationDate ? new Date(place.verificationDate) : undefined,
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error("[sitemap] Published places could not be loaded; serving static routes.", error);
  }

  return entries;
}
