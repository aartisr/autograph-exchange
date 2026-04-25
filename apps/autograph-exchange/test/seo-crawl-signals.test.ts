import { describe, expect, it } from "vitest";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import {
  AUTOGRAPH_PUBLIC_LAST_MODIFIED,
  publicRoutes,
} from "../app/lib/public-routes";

describe("Autograph Exchange crawl signals", () => {
  it("keeps sitemap entries canonical and stable", async () => {
    const entries = await sitemap();
    const paths = entries.map((entry) => new URL(entry.url).pathname);

    expect(paths).toEqual(
      expect.arrayContaining(publicRoutes.map((route) => route.path)),
    );
    expect(entries.slice(0, publicRoutes.length).map((entry) => entry.lastModified)).toEqual(
      publicRoutes.map((route) => route.lastModified),
    );
    expect(entries[0].lastModified).toBe(AUTOGRAPH_PUBLIC_LAST_MODIFIED);
    expect(entries[0].url).toBe("https://autograph.foreverlotus.com/");
    expect(paths.filter((path) => path.startsWith("/profiles/")).every((path) => !path.endsWith("/"))).toBe(true);
  });

  it("allows Bing crawlers while blocking private routes", () => {
    const robotRules = Array.isArray(robots().rules) ? robots().rules : [robots().rules];
    const bingbotRule = robotRules.find((rule) => rule.userAgent === "Bingbot");
    const adIdxBotRule = robotRules.find((rule) => rule.userAgent === "AdIdxBot");
    const openAiSearchRule = robotRules.find((rule) => rule.userAgent === "OAI-SearchBot");
    const perplexityRule = robotRules.find((rule) => rule.userAgent === "PerplexityBot");
    const claudeSearchRule = robotRules.find((rule) => rule.userAgent === "Claude-SearchBot");
    const wildcardRule = robotRules.find((rule) => rule.userAgent === "*");

    expect(bingbotRule).toBeTruthy();
    expect(adIdxBotRule).toBeTruthy();
    expect(openAiSearchRule).toBeTruthy();
    expect(perplexityRule).toBeTruthy();
    expect(claudeSearchRule).toBeTruthy();
    expect(wildcardRule).toBeTruthy();

    const allow = Array.isArray(bingbotRule?.allow) ? bingbotRule?.allow : [bingbotRule?.allow];
    const disallow = Array.isArray(bingbotRule?.disallow)
      ? bingbotRule?.disallow
      : [bingbotRule?.disallow];

    expect(allow).toEqual(
      expect.arrayContaining([
        "/",
        "/profiles",
        "/profiles/",
        "/llms.txt",
        "/llms-full.txt",
        "/BingSiteAuth.xml",
        "/CFDF5F11-6B5A-420D-A46E-578D550EA51B.txt",
      ]),
    );
    expect(disallow).toEqual(expect.arrayContaining(["/api/", "/admin/", "/admin", "/sign-in"]));
    expect(robots().sitemap).toBe("https://autograph.foreverlotus.com/sitemap.xml");
  });
});
