import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const stylesheetPath = resolve(__dirname, "../../../packages/autograph-feature/styles.css");
const stylesheet = readFileSync(stylesheetPath, "utf8");

function extractToken(source: string, name: string): string {
  const pattern = new RegExp(`${name}:\\s*([^;]+);`);
  const match = source.match(pattern);

  if (!match) {
    throw new Error(`Missing token: ${name}`);
  }

  return match[1].trim();
}

function extractDarkModeBlock(source: string): string {
  const marker = "@media (prefers-color-scheme: dark)";
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error("Missing dark mode block");
  }

  return source.slice(start);
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(`Unsupported color format for contrast check: ${hex}`);
  }

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function channelToLinear(channel: number) {
  const normalized = channel / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

function contrastRatio(foreground: string, background: string) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe("autograph feature contrast tokens", () => {
  it("defines safe light-mode select option tokens", () => {
    const optionSurface = extractToken(stylesheet, "--autograph-select-option-surface");
    const optionText = extractToken(stylesheet, "--autograph-select-option-text");
    const selectedSurface = extractToken(stylesheet, "--autograph-select-option-selected-surface");
    const selectedText = extractToken(stylesheet, "--autograph-select-option-selected-text");

    expect(optionSurface).not.toBe(optionText);
    expect(selectedSurface).not.toBe(selectedText);
    expect(contrastRatio(optionText, optionSurface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(selectedText, selectedSurface)).toBeGreaterThanOrEqual(4.5);
  });

  it("defines safe dark-mode select option tokens", () => {
    const darkBlock = extractDarkModeBlock(stylesheet);
    const optionSurface = extractToken(darkBlock, "--autograph-select-option-surface");
    const optionText = extractToken(darkBlock, "--autograph-select-option-text");
    const selectedSurface = extractToken(darkBlock, "--autograph-select-option-selected-surface");
    const selectedText = extractToken(darkBlock, "--autograph-select-option-selected-text");

    expect(optionSurface).not.toBe(optionText);
    expect(selectedSurface).not.toBe(selectedText);
    expect(contrastRatio(optionText, optionSurface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(selectedText, selectedSurface)).toBeGreaterThanOrEqual(4.5);
  });

  it("styles native select options explicitly so they do not inherit unsafe colors", () => {
    expect(stylesheet).toContain("select.app-form-input option");
    expect(stylesheet).toContain("select.autograph-input option");
    expect(stylesheet).toContain("option:checked");
  });
});
