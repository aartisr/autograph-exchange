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
  const p1 = 24 + (base % 32);
  const p2 = 70 + (base % 54);
  const p3 = 145 + (base % 68);
  const p4 = 228 + (base % 82);
  const p5 = 314 + (base % 48);
  return `M 18 ${58 + (base % 8)} C ${p1} ${18 + (base % 30)}, ${p2} ${92 - (base % 28)}, ${p3} ${44 + (base % 16)} S ${p4} ${18 + (base % 34)}, ${p5} ${55 + (base % 14)}`;
}

export function buildSignaturePreset(userId: string, label: string): SignaturePreset {
  const seed = createSeed(`${userId}:${label}`);
  const hueStart = 134 + (seed % 26);
  const hueEnd = hueStart + 18 + (seed % 22);

  return {
    label: label || "Your signature",
    hueStart,
    hueEnd,
    strokeA: createStroke(seed, 7),
    strokeB: createStroke(seed, 19),
  };
}
