import type { SignaturePreset } from "./types";

function createSeed(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 100000;
  }
  return hash;
}

function createStroke(seed: number, offset: number): string {
  const base = seed + offset;
  const p1 = 48 + (base % 24);
  const p2 = 136 + (base % 34);
  const p3 = 244 + (base % 30);
  const p4 = 334 + (base % 22);
  return `M 22 ${72 + (base % 5)} C ${p1} ${88 - (base % 18)}, ${p2} ${86 + (base % 10)}, ${p3} ${70 + (base % 8)} S ${p4} ${78 - (base % 12)}, 368 ${72 + (base % 6)}`;
}

function createFlourish(seed: number): string {
  const lift = 10 + (seed % 12);
  const swing = 246 + (seed % 28);
  const tail = 338 + (seed % 18);
  return `M 114 82 C 168 ${102 - lift}, ${swing} ${92 - Math.floor(lift / 2)}, ${tail} 78 S 382 70, 384 ${76 + (seed % 6)}`;
}

function sanitizeLabel(label: string) {
  const trimmed = label.trim().replace(/\s+/g, " ");
  return trimmed || "Your signature";
}

function createInitials(label: string) {
  const parts = label.split(" ").filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
  return initials || label.slice(0, 1).toUpperCase();
}

export function buildSignaturePreset(userId: string, label: string): SignaturePreset {
  const safeLabel = sanitizeLabel(label);
  const seed = createSeed(`${userId}:${safeLabel}`);
  const hueStart = 134 + (seed % 26);
  const hueEnd = hueStart + 18 + (seed % 22);
  const wordCount = safeLabel.split(" ").length;
  const letterCount = safeLabel.replace(/\s+/g, "").length;
  const initials = createInitials(safeLabel);

  return {
    label: safeLabel,
    initials,
    hueStart,
    hueEnd,
    strokeA: createStroke(seed, 7),
    strokeB: createStroke(seed, 19),
    flourish: createFlourish(seed),
    wordmarkSize: Math.max(34, 52 - Math.min(letterCount, 18)),
    wordmarkTilt: -8 - (seed % 7),
    wordmarkSpacing: wordCount > 1 ? 0.6 : 0.2,
    monogramSize: 34 + (seed % 10),
    monogramOpacity: 0.1 + ((seed % 6) * 0.03),
  };
}
