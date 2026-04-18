import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_AUTOGRAPH_COPY } from "../../../packages/autograph-feature/copy";
import { formatRelativeDate, rolePairLabel, titleCaseRole } from "../../../packages/autograph-feature/screen-utils";

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
});
