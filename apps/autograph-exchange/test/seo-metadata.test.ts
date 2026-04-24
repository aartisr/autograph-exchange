import { describe, expect, it } from "vitest";
import { siteDescription, siteTitle } from "../app/lib/seo";

describe("Autograph Exchange search metadata", () => {
  it("keeps public title and description descriptive for search snippets", () => {
    expect(siteTitle.length).toBeGreaterThanOrEqual(35);
    expect(siteTitle.length).toBeLessThanOrEqual(70);
    expect(siteDescription.length).toBeGreaterThanOrEqual(120);
    expect(siteDescription.length).toBeLessThanOrEqual(180);
  });
});
