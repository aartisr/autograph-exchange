import type { MetadataRoute } from "next";
import { autographService } from "./api/autographs/_service";
import { publicRoutes } from "./lib/public-routes";
import { getSiteUrl } from "./lib/site-url";

const baseUrl = getSiteUrl();

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = publicRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const profiles = await autographService.listPublicAutographProfiles();
    const profileRoutes = profiles.map((profile) => ({
      url: `${baseUrl}/profiles/${encodeURIComponent(profile.id)}`,
      lastModified: profile.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...routes, ...profileRoutes];
  } catch {
    return routes;
  }
}
