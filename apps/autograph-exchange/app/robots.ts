import type { MetadataRoute } from "next";
import { getSiteUrl } from "./lib/site-url";

const baseUrl = getSiteUrl();
const allowPublic = [
  "/",
  "/profiles",
  "/profiles/",
  "/llms.txt",
  "/llms-full.txt",
  "/opengraph-image",
  "/twitter-image",
  "/BingSiteAuth.xml",
  "/CFDF5F11-6B5A-420D-A46E-578D550EA51B.txt",
];
const disallowPrivate = ["/api/", "/admin/", "/admin", "/sign-in"];
const indexableCrawlerUserAgents = [
  "Googlebot",
  "Bingbot",
  "AdIdxBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-SearchBot",
  "Claude-User",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...indexableCrawlerUserAgents.map((userAgent) => ({
        userAgent,
        allow: allowPublic,
        disallow: disallowPrivate,
      })),
      {
        userAgent: "*",
        allow: allowPublic,
        disallow: disallowPrivate,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
