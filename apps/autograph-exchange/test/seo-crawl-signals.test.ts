import { describe, expect, it } from "vitest";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import {
  AUTOGRAPH_PUBLIC_LAST_MODIFIED,
  publicRoutes,
} from "../app/lib/public-routes";

describe("Autograph Exchange crawl signals", () => {
  it("keeps sitemap entries canonical and stable", () => {
    const entries = sitemap();
    const paths = entries.map((entry) => new URL(entry.url).pathname);

    expect(paths).toEqual(publicRoutes.map((route) => route.path));
    expect(entries.map((entry) => entry.lastModified)).toEqual(
      publicRoutes.map((route) => route.lastModified),
    );
    expect(entries[0].lastModified).toBe(AUTOGRAPH_PUBLIC_LAST_MODIFIED);
    expect(entries[0].url).toBe("https://autograph.foreverlotus.com/");
  });

  it("allows Bing crawlers while blocking private routes", () => {
    const robotRules = Array.isArray(robots().rules) ? robots().rules : [robots().rules];
    const bingbotRule = robotRules.find((rule) => rule.userAgent === "Bingbot");
    const adIdxBotRule = robotRules.find((rule) => rule.userAgent === "AdIdxBot");
    const wildcardRule = robotRules.find((rule) => rule.userAgent === "*");

    expect(bingbotRule).toBeTruthy();
    expect(adIdxBotRule).toBeTruthy();
    expect(wildcardRule).toBeTruthy();

    const allow = Array.isArray(bingbotRule?.allow) ? bingbotRule?.allow : [bingbotRule?.allow];
    const disallow = Array.isArray(bingbotRule?.disallow)
      ? bingbotRule?.disallow
      : [bingbotRule?.disallow];

    expect(allow).toEqual(
      expect.arrayContaining([
        "/",
        "/llms.txt",
        "/llms-full.txt",
        "/BingSiteAuth.xml",
        "/CFDF5F11-6B5A-420D-A46E-578D550EA51B.txt",
      ]),
    );
    expect(disallow).toEqual(expect.arrayContaining(["/api/", "/sign-in"]));
    expect(robots().sitemap).toBe("https://autograph.foreverlotus.com/sitemap.xml");
  });
});
