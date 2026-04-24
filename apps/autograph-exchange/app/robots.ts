import type { MetadataRoute } from "next";
import { getSiteUrl } from "./lib/site-url";

const baseUrl = getSiteUrl();
const allowPublic = [
  "/",
  "/llms.txt",
  "/llms-full.txt",
  "/opengraph-image",
  "/twitter-image",
  "/BingSiteAuth.xml",
  "/CFDF5F11-6B5A-420D-A46E-578D550EA51B.txt",
];
const disallowPrivate = ["/api/", "/sign-in"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Bingbot",
        allow: allowPublic,
        disallow: disallowPrivate,
      },
      {
        userAgent: "AdIdxBot",
        allow: allowPublic,
        disallow: disallowPrivate,
      },
      {
        userAgent: "*",
        allow: allowPublic,
        disallow: disallowPrivate,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
