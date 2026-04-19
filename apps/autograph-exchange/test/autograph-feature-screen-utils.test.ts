import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_AUTOGRAPH_COPY } from "../../../packages/autograph-feature/copy";
import { buildKeepsakeSvg, formatRelativeDate, rolePairLabel, titleCaseRole } from "../../../packages/autograph-feature/screen-utils";

const SAMPLE_KEEPSAKE_REQUEST = {
  id: "request-1",
  requesterDisplayName: "Aarti",
  signerDisplayName: "Guide",
  requesterRole: "student",
  signerRole: "teacher",
  message: "For helping me stay steady through every challenge.",
  signatureText: "With blessings and gratitude.",
  createdAt: "2026-04-17T12:00:00.000Z",
  signedAt: "2026-04-18T12:00:00.000Z",
} as const;

function extractGradientType(token: string): "linearGradient" | "radialGradient" {
  return token.includes("linearGradient") ? "linearGradient" : "radialGradient";
}

describe("autograph feature screen utils", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats very recent dates as just now", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T12:00:00.000Z"));

    expect(formatRelativeDate("2026-04-18T11:59:50.000Z", DEFAULT_AUTOGRAPH_COPY)).toBe(DEFAULT_AUTOGRAPH_COPY.justNow);
  });

  it("formats older dates using relative units before falling back to locale dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T12:00:00.000Z"));

    expect(formatRelativeDate("2026-04-18T11:45:00.000Z", DEFAULT_AUTOGRAPH_COPY)).toBe("15m ago");
    expect(formatRelativeDate("2026-04-18T09:00:00.000Z", DEFAULT_AUTOGRAPH_COPY)).toBe("3h ago");
    expect(formatRelativeDate("2026-04-15T12:00:00.000Z", DEFAULT_AUTOGRAPH_COPY)).toBe("3d ago");
  });

  it("falls back cleanly when a date is invalid", () => {
    expect(formatRelativeDate("not-a-date", DEFAULT_AUTOGRAPH_COPY)).toBe(DEFAULT_AUTOGRAPH_COPY.recently);
  });

  it("formats roles and request pairs for UI display", () => {
    expect(titleCaseRole("teacher")).toBe("Teacher");
    expect(titleCaseRole("student")).toBe("Student");
    expect(
      rolePairLabel({
        requesterRole: "student",
        signerRole: "teacher",
      } as never),
    ).toBe("student to teacher");
  });

  it("builds keepsake svg with balanced defs and gradient tags", () => {
    const svg = buildKeepsakeSvg(DEFAULT_AUTOGRAPH_COPY, SAMPLE_KEEPSAKE_REQUEST as never);

    expect(svg).toContain("<defs>");
    expect(svg).toContain("</defs>");

    const gradientTokens = Array.from(svg.matchAll(/<\/?(?:linearGradient|radialGradient)\b[^>]*>/g), (match) => match[0]);
    const stack: Array<"linearGradient" | "radialGradient"> = [];

    for (const token of gradientTokens) {
      const type = extractGradientType(token);
      const isClosingTag = token.startsWith("</");

      if (!isClosingTag) {
        stack.push(type);
        continue;
      }

      expect(stack.pop()).toBe(type);
    }

    expect(stack).toHaveLength(0);
  });

  it("keeps critical premium gradients present in output", () => {
    const svg = buildKeepsakeSvg(DEFAULT_AUTOGRAPH_COPY, SAMPLE_KEEPSAKE_REQUEST as never);

    expect(svg).toContain('id="sig-gradient"');
    expect(svg).toContain('id="sig-accent"');
    expect(svg).toContain('id="royal-gold"');
  });
});
