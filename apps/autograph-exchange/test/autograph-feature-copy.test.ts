import { describe, expect, it } from "vitest";
import { DEFAULT_AUTOGRAPH_COPY, mergeAutographCopy } from "../../../packages/autograph-feature/copy";

describe("autograph feature copy", () => {
  it("preserves defaults when no overrides are provided", () => {
    expect(mergeAutographCopy()).toEqual(DEFAULT_AUTOGRAPH_COPY);
  });

  it("merges overrides without dropping untouched defaults", () => {
    const merged = mergeAutographCopy({
      heroTitle: "A different title",
      askForAutograph: "Send it",
    });

    expect(merged.heroTitle).toBe("A different title");
    expect(merged.askForAutograph).toBe("Send it");
    expect(merged.stepOneTitle).toBe(DEFAULT_AUTOGRAPH_COPY.stepOneTitle);
    expect(merged.noArchive).toBe(DEFAULT_AUTOGRAPH_COPY.noArchive);
  });
});
