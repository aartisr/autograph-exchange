import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const stylesheetPath = resolve(__dirname, "../../../packages/autograph-feature/styles.css");
const stylesheet = readFileSync(stylesheetPath, "utf8");
const appStylesheet = readFileSync(resolve(__dirname, "../app/globals.css"), "utf8");

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

function extractHexes(value: string): string[] {
  return (value.match(/#[0-9a-fA-F]{3,6}/g) ?? []).map((hex) => hex.toLowerCase());
}

function minContrastAgainstStops(foreground: string, gradientOrColor: string): number {
  const stops = extractHexes(gradientOrColor);
  if (!stops.length) {
    throw new Error(`No hex stops found in color token: ${gradientOrColor}`);
  }

  return Math.min(...stops.map((stop) => contrastRatio(foreground, stop)));
}

function expectComboboxTokensMeetContrast(source: string) {
  const listSurface = extractToken(source, "--autograph-combobox-list-surface");
  const optionText = extractToken(source, "--autograph-combobox-option-text");
  const optionMeta = extractToken(source, "--autograph-combobox-option-meta");
  const hoverSurface = extractToken(source, "--autograph-combobox-option-hover-surface");
  const selectedSurface = extractToken(source, "--autograph-combobox-option-selected-surface");

  expect(contrastRatio(optionText, listSurface)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(optionMeta, listSurface)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(optionText, hoverSurface)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(optionMeta, hoverSurface)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(optionText, selectedSurface)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(optionMeta, selectedSurface)).toBeGreaterThanOrEqual(4.5);
}

function expectLightboxTokensMeetContrast(source: string) {
  const panelSurface = extractToken(source, "--autograph-lightbox-panel-surface");
  const panelText = extractToken(source, "--autograph-lightbox-panel-text");
  const closeSurface = extractToken(source, "--autograph-lightbox-close-surface");
  const closeHoverSurface = extractToken(source, "--autograph-lightbox-close-hover-surface");
  const closeText = extractToken(source, "--autograph-lightbox-close-text");

  expect(contrastRatio(panelText, panelSurface)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(closeText, closeSurface)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(closeText, closeHoverSurface)).toBeGreaterThanOrEqual(4.5);
}

describe("autograph feature contrast tokens", () => {
  it("defines safe light-mode input tokens for typed and placeholder text", () => {
    const inputSurface = extractToken(stylesheet, "--autograph-input-surface");
    const inputText = extractToken(stylesheet, "--autograph-input-text");
    const inputPlaceholder = extractToken(stylesheet, "--autograph-input-placeholder");
    const selectionSurface = extractToken(stylesheet, "--autograph-input-selection-surface");
    const selectionText = extractToken(stylesheet, "--autograph-input-selection-text");

    expect(inputSurface).not.toBe(inputText);
    expect(inputSurface).not.toBe(inputPlaceholder);
    expect(selectionSurface).not.toBe(selectionText);
    expect(contrastRatio(inputText, inputSurface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(inputPlaceholder, inputSurface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(selectionText, selectionSurface)).toBeGreaterThanOrEqual(4.5);
  });

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
    const inputSurface = extractToken(darkBlock, "--autograph-input-surface");
    const inputText = extractToken(darkBlock, "--autograph-input-text");
    const inputPlaceholder = extractToken(darkBlock, "--autograph-input-placeholder");
    const inputSelectionSurface = extractToken(darkBlock, "--autograph-input-selection-surface");
    const inputSelectionText = extractToken(darkBlock, "--autograph-input-selection-text");
    const optionSurface = extractToken(darkBlock, "--autograph-select-option-surface");
    const optionText = extractToken(darkBlock, "--autograph-select-option-text");
    const selectedSurface = extractToken(darkBlock, "--autograph-select-option-selected-surface");
    const selectedText = extractToken(darkBlock, "--autograph-select-option-selected-text");

    expect(inputSurface).not.toBe(inputText);
    expect(inputSurface).not.toBe(inputPlaceholder);
    expect(inputSelectionSurface).not.toBe(inputSelectionText);
    expect(contrastRatio(inputText, inputSurface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(inputPlaceholder, inputSurface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(inputSelectionText, inputSelectionSurface)).toBeGreaterThanOrEqual(4.5);
    expect(optionSurface).not.toBe(optionText);
    expect(selectedSurface).not.toBe(selectedText);
    expect(contrastRatio(optionText, optionSurface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(selectedText, selectedSurface)).toBeGreaterThanOrEqual(4.5);
  });

  it("defines safe combobox popup tokens in light and dark mode", () => {
    const darkBlock = extractDarkModeBlock(stylesheet);

    expectComboboxTokensMeetContrast(stylesheet);
    expectComboboxTokensMeetContrast(darkBlock);
    expect(stylesheet).toContain(".autograph-combobox-list");
    expect(stylesheet).toContain("--autograph-combobox-list-surface");
  });

  it("keeps status banner text readable in light and dark mode", () => {
    const lightStatusText = extractToken(stylesheet, "--autograph-status-banner-text");
    const lightStatusBg = extractToken(stylesheet, "--autograph-status-banner-bg");
    const darkBlock = extractDarkModeBlock(stylesheet);
    const darkStatusText = extractToken(darkBlock, "--autograph-status-banner-text");
    const darkStatusBg = extractToken(darkBlock, "--autograph-status-banner-bg");

    expect(minContrastAgainstStops(lightStatusText, lightStatusBg)).toBeGreaterThanOrEqual(4.5);
    expect(minContrastAgainstStops(darkStatusText, darkStatusBg)).toBeGreaterThanOrEqual(4.5);
  });

  it("styles interactive text surfaces explicitly so they do not inherit unsafe colors", () => {
    expect(stylesheet).toContain(".app-form-input::placeholder");
    expect(stylesheet).toContain(".app-form-input::selection");
    expect(stylesheet).toContain(".app-form-input:disabled");
    expect(stylesheet).toContain(":-webkit-autofill");
    expect(stylesheet).toContain(".autograph-shell ::selection");
    expect(stylesheet).toContain("select.app-form-input option");
    expect(stylesheet).toContain("select.autograph-input option");
    expect(stylesheet).toContain("option:checked");
  });

  it("keeps primary action text readable against gradient button backgrounds in light and dark mode", () => {
    const lightPrimaryText = extractToken(stylesheet, "--autograph-button-primary-text");
    const lightPrimaryBg = extractToken(stylesheet, "--autograph-button-primary-bg");
    const darkBlock = extractDarkModeBlock(stylesheet);
    const darkPrimaryText = extractToken(darkBlock, "--autograph-button-primary-text");
    const darkPrimaryBg = extractToken(darkBlock, "--autograph-button-primary-bg");

    expect(minContrastAgainstStops(lightPrimaryText, lightPrimaryBg)).toBeGreaterThanOrEqual(4.5);
    expect(minContrastAgainstStops(darkPrimaryText, darkPrimaryBg)).toBeGreaterThanOrEqual(4.5);
    expect(stylesheet).toContain(".autograph-feature-cta");
  });

  it("keeps enlarged profile photo dialog controls readable in light and dark mode", () => {
    const darkBlock = extractDarkModeBlock(stylesheet);

    expectLightboxTokensMeetContrast(stylesheet);
    expectLightboxTokensMeetContrast(darkBlock);
    expect(stylesheet).toContain(".autograph-photo-lightbox");
    expect(stylesheet).toContain(".autograph-photo-lightbox-close:focus-visible");
  });

  it("keeps dark-mode momentum and setup tiles on dark surfaces", () => {
    const darkBlock = extractDarkModeBlock(stylesheet);

    expect(darkBlock).toContain(".autograph-momentum-step {");
    expect(darkBlock).toContain("background: linear-gradient(180deg, rgba(36, 60, 51, 0.94) 0%, rgba(28, 47, 40, 0.9) 100%);");
    expect(darkBlock).toContain(".autograph-momentum-step.is-complete {");
    expect(darkBlock).toContain("background: linear-gradient(180deg, rgba(43, 84, 67, 0.94) 0%, rgba(34, 66, 53, 0.9) 100%);");
    expect(darkBlock).toContain(".autograph-step-state-success {");
    expect(darkBlock).toContain(".autograph-step-state-warning {");
  });

  it("keeps dark-mode keepsake panels and collection cards on dark surfaces", () => {
    const darkBlock = extractDarkModeBlock(stylesheet);

    expect(darkBlock).toContain(".autograph-collection-spotlight {");
    expect(darkBlock).toContain(".autograph-social-card {");
    expect(darkBlock).toContain(".autograph-keepsake-panel {");
    expect(darkBlock).toContain(".autograph-keepsake-panel-signature {");
    expect(darkBlock).toContain(".autograph-keepsake-panel-label,");
    expect(darkBlock).toContain(".autograph-keepsake-footer {");
  });

  it("keeps the book styling away from orb backgrounds and cramped display type", () => {
    expect(stylesheet).not.toContain("radial-gradient");
    expect(stylesheet).not.toMatch(/letter-spacing:\s*-/);
  });

  it("keeps feature grids and profile tiles fluid on narrow screens", () => {
    expect(stylesheet).toContain("grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));");
    expect(stylesheet).toContain("grid-template-columns: repeat(auto-fit, minmax(min(100%, 8.5rem), 1fr));");
    expect(stylesheet).toContain("grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));");
    expect(stylesheet).toContain("grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));");
    expect(stylesheet).toContain("overflow-wrap: anywhere;");
    expect(stylesheet).toContain("@media (max-width: 420px)");
  });

  it("keeps the standalone app header and forms within the viewport", () => {
    expect(appStylesheet).toContain("overflow-x: clip;");
    expect(appStylesheet).toContain("grid-template-columns: minmax(0, 1fr) auto auto;");
    expect(appStylesheet).toContain("overflow-x: auto;");
    expect(appStylesheet).toContain("scrollbar-width: none;");
    expect(appStylesheet).toContain("width: min(100%, 32rem);");
    expect(appStylesheet).toContain("flex: 1 1 calc(50% - 0.25rem);");
  });
});
