import { describe, expect, it } from "vitest";
import {
  buildAutographProfileDescription,
  buildNoIndexMetadata,
  buildPageMetadata,
  buildProfilePageJsonLd,
  siteDescription,
  siteTitle,
} from "../app/lib/seo";

describe("Autograph Exchange search metadata", () => {
  it("keeps public title and description descriptive for search snippets", () => {
    expect(siteTitle.length).toBeGreaterThanOrEqual(35);
    expect(siteTitle.length).toBeLessThanOrEqual(70);
    expect(siteDescription.length).toBeGreaterThanOrEqual(120);
    expect(siteDescription.length).toBeLessThanOrEqual(180);
  });

  it("enriches public page metadata with canonical and Bing crawl directives", () => {
    const metadata = buildPageMetadata({
      title: "Autograph Exchange Profiles for Teachers and Students",
      description:
        "Browse teacher and student profiles in Autograph Exchange, review focus areas, and request meaningful digital autograph keepsakes from public profile pages.",
      path: "/profiles",
      keywords: ["teacher profiles", "student profiles"],
    });

    expect(metadata.alternates?.canonical).toContain("/profiles");
    expect(metadata.openGraph?.url).toContain("/profiles");
    expect(metadata.twitter?.card).toBe("summary_large_image");
    expect(metadata.other?.bingbot).toContain("max-image-preview:large");
    expect(metadata.keywords).toEqual(expect.arrayContaining(["teacher profiles", "student profiles"]));
  });

  it("marks protected workspace metadata as noindex", () => {
    const metadata = buildNoIndexMetadata({
      title: "Autograph Exchange Profile Administration Workspace",
      description:
        "Manage teacher and student profile visibility, review profile details, and maintain public autograph request pages in the protected administration workspace.",
      path: "/admin/profiles",
    });

    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
    });
    expect(metadata.other?.bingbot).toBe("noindex, nofollow");
  });

  it("builds profile page descriptions and structured data from visible public profile fields", () => {
    const profile = {
      id: "profile-1",
      displayName: "Asha Raman",
      role: "teacher",
      headline: "Guiding mindful creative writing circles",
      bio: "Asha helps students shape meaningful keepsakes through reflective writing, gratitude practices, and community storytelling.",
      avatarUrl: "/api/autographs/profiles/profile-1/avatar",
      affiliation: "ForeverLotus Academy",
      location: "Seattle",
      subjects: ["creative writing", "mindfulness"],
      interests: ["gratitude"],
      signaturePrompt: "Share one moment you want to remember.",
      updatedAt: "2026-04-24",
    };

    const description = buildAutographProfileDescription(profile);
    const jsonLd = buildProfilePageJsonLd(profile);
    const graph = jsonLd["@graph"];
    const profilePageNode = graph.find((entry) => entry["@type"] === "ProfilePage");
    const personNode = graph.find((entry) => entry["@type"] === "Person");

    expect(description.length).toBeGreaterThanOrEqual(110);
    expect(description.length).toBeLessThanOrEqual(175);
    expect(profilePageNode?.url).toContain("/profiles/profile-1");
    expect(personNode?.name).toBe("Asha Raman");
    expect(personNode?.knowsAbout).toEqual(expect.arrayContaining(["creative writing", "mindfulness"]));
  });
});
