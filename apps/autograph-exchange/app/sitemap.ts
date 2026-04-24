import type { MetadataRoute } from "next";
import { publicRoutes } from "./lib/public-routes";
import { getSiteUrl } from "./lib/site-url";

const baseUrl = getSiteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
