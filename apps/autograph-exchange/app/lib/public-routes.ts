import type { MetadataRoute } from "next";

export const AUTOGRAPH_PUBLIC_LAST_MODIFIED = "2026-04-23";

type PublicRoute = {
  path: string;
  lastModified: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

export const publicRoutes: PublicRoute[] = [
  {
    path: "/",
    lastModified: AUTOGRAPH_PUBLIC_LAST_MODIFIED,
    changeFrequency: "daily",
    priority: 1,
  },
  {
    path: "/profiles",
    lastModified: AUTOGRAPH_PUBLIC_LAST_MODIFIED,
    changeFrequency: "weekly",
    priority: 0.8,
  },
];
