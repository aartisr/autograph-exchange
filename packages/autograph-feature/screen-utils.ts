import type { AutographExchangeCopy, AutographProfile, AutographRequest, AutographRole } from "./types";

export const INPUT_CLASS =
  "app-form-input autograph-input";

export const REQUEST_PROMPTS = [
  {
    label: "Thank a guide",
    text: "Thank you for guiding me. Could you leave me a short autograph message?",
  },
  {
    label: "Mark the journey",
    text: "Your support has meant a lot to me. I would love an autograph to remember this journey.",
  },
  {
    label: "Ask for a blessing",
    text: "Could you sign with a short blessing or encouragement for me to keep?",
  },
] as const;

export const SIGNATURE_IDEAS = [
  { label: "Blessing", text: "With blessings and gratitude." },
  { label: "Encouragement", text: "Keep going with courage and clarity." },
  { label: "Recognition", text: "Proud of your journey." },
] as const;

export type MomentumStep = {
  id: "profile" | "request" | "collect";
  label: string;
  value: string;
  completed: boolean;
};

export type MomentumState = {
  completionPercent: number;
  steps: MomentumStep[];
  nextTitle: string;
  nextDetail: string;
  celebrationTitle: string | null;
  celebrationDetail: string | null;
};

export type SignerSearchEntry = {
  profile: AutographProfile;
  displayNameLower: string;
  roleLower: string;
  combinedLower: string;
};

export type KeepsakeBadge = {
  label: string;
  tone: "new" | "featured" | "treasured";
};

export function formatRelativeDate(iso: string, copy: AutographExchangeCopy): string {
  const target = new Date(iso).getTime();
  if (!Number.isFinite(target)) {
    return copy.recently;
  }

  const diffMs = Date.now() - target;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return copy.justNow;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 14) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function titleCaseRole(role: AutographRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function interpolateCount(template: string, count: number): string {
  return template.replace(/\{count\}/g, String(count));
}

export function rolePairLabel(
  request: Pick<AutographRequest, "requesterRole" | "signerRole">,
  roleLabels?: Partial<Record<AutographRole, string>>,
): string {
  const requesterRole = roleLabels?.[request.requesterRole] ?? titleCaseRole(request.requesterRole);
  const signerRole = roleLabels?.[request.signerRole] ?? titleCaseRole(request.signerRole);
  return `${requesterRole} to ${signerRole}`;
}

export function signerSearchLabel(
  profile: AutographProfile,
  roleLabels?: Partial<Record<AutographRole, string>>,
): string {
  return `${profile.displayName} ${roleLabels?.[profile.role] ?? titleCaseRole(profile.role)}`;
}

export function buildSignerSearchEntries(
  profiles: AutographProfile[],
  roleLabels?: Partial<Record<AutographRole, string>>,
): SignerSearchEntry[] {
  return profiles.map((profile) => {
    const displayNameLower = profile.displayName.toLowerCase();
    const roleLower = (roleLabels?.[profile.role] ?? titleCaseRole(profile.role)).toLowerCase();

    return {
      profile,
      displayNameLower,
      roleLower,
      combinedLower: `${displayNameLower} ${roleLower}`.trim(),
    };
  });
}

export function signerMatchesQuery(
  profile: AutographProfile,
  query: string,
  roleLabels?: Partial<Record<AutographRole, string>>,
): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    profile.displayName,
    profile.role,
    titleCaseRole(profile.role),
    signerSearchLabel(profile, roleLabels),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function signerMatchScore(profile: AutographProfile, query: string): number {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return 0;
  }

  const displayName = profile.displayName.toLowerCase();
  const role = titleCaseRole(profile.role).toLowerCase();
  const combined = signerSearchLabel(profile).toLowerCase();

  if (displayName === normalizedQuery) {
    return 100;
  }

  if (displayName.startsWith(normalizedQuery)) {
    return 80;
  }

  if (displayName.includes(normalizedQuery)) {
    return 60;
  }

  if (role.startsWith(normalizedQuery)) {
    return 40;
  }

  if (combined.includes(normalizedQuery)) {
    return 20;
  }

  return -1;
}

function signerEntryMatchScore(entry: SignerSearchEntry, query: string): number {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return 0;
  }

  if (entry.displayNameLower === normalizedQuery) {
    return 100;
  }

  if (entry.displayNameLower.startsWith(normalizedQuery)) {
    return 80;
  }

  if (entry.displayNameLower.includes(normalizedQuery)) {
    return 60;
  }

  if (entry.roleLower.startsWith(normalizedQuery)) {
    return 40;
  }

  if (entry.combinedLower.includes(normalizedQuery)) {
    return 20;
  }

  return -1;
}

export function rankSignerMatches(profiles: AutographProfile[], query: string): AutographProfile[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [...profiles].sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  return profiles
    .map((profile) => ({ profile, score: signerMatchScore(profile, normalizedQuery) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.profile.displayName.localeCompare(b.profile.displayName);
    })
    .map((entry) => entry.profile);
}

export function rankSignerSearchEntries(entries: SignerSearchEntry[], query: string): AutographProfile[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [...entries]
      .sort((a, b) => a.profile.displayName.localeCompare(b.profile.displayName))
      .map((entry) => entry.profile);
  }

  return entries
    .map((entry) => ({ entry, score: signerEntryMatchScore(entry, normalizedQuery) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.entry.profile.displayName.localeCompare(b.entry.profile.displayName);
    })
    .map((item) => item.entry.profile);
}

export function buildCollectionSummary(copy: AutographExchangeCopy, archiveCount: number): string {
  if (archiveCount <= 0) {
    return copy.collectionEmptySummary;
  }

  if (archiveCount === 1) {
    return copy.collectionFirstSummary;
  }

  if (archiveCount < 5) {
    return interpolateCount(copy.collectionStarterSummary, archiveCount);
  }

  if (archiveCount < 10) {
    return interpolateCount(copy.collectionGrowingSummary, archiveCount);
  }

  return interpolateCount(copy.collectionArchiveSummary, archiveCount);
}

export function buildKeepsakeBadge({
  copy,
  index,
  isNew,
}: {
  copy: AutographExchangeCopy;
  index: number;
  isNew: boolean;
}): KeepsakeBadge {
  if (isNew) {
    return { label: copy.newKeepsakeLabel, tone: "new" };
  }

  if (index === 0) {
    return { label: copy.featuredKeepsakeLabel, tone: "featured" };
  }

  return { label: copy.treasuredKeepsakeLabel, tone: "treasured" };
}

export function buildKeepsakeText(copy: AutographExchangeCopy, item: AutographRequest): string {
  const signedOn = formatRelativeDate(item.signedAt ?? item.createdAt, copy);

  return [
    `${item.requesterDisplayName} ↔ ${item.signerDisplayName}`,
    `${copy.keepsakeMessageLabel}: ${item.message}`,
    `${copy.keepsakeAutographLabel}: ${item.signatureText ?? ""}`,
    `${copy.signedPrefix} ${signedOn}`,
  ].join("\n");
}

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapSvgText(value: string, lineLength: number): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean);

  if (!words.length) {
    return [""];
  }

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= lineLength || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function createSvgSeed(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 100000;
  }
  return hash;
}

function createSvgStroke(seed: number, offset: number): string {
  const base = seed + offset;
  const p1 = 84 + (base % 44);
  const p2 = 204 + (base % 68);
  const p3 = 388 + (base % 74);
  const p4 = 538 + (base % 58);
  return `M 56 ${130 + (base % 8)} C ${p1} ${168 - (base % 26)}, ${p2} ${154 + (base % 18)}, ${p3} ${126 + (base % 14)} S ${p4} ${146 - (base % 16)}, 640 ${132 + (base % 10)}`;
}

function createSvgFlourish(seed: number): string {
  const lift = 14 + (seed % 16);
  const swing = 378 + (seed % 64);
  const tail = 562 + (seed % 50);
  return `M 162 146 C 236 ${186 - lift}, ${swing} ${162 - Math.floor(lift / 2)}, ${tail} 144 S 636 130, 646 ${140 + (seed % 10)}`;
}

function createSvgInitials(label: string): string {
  const parts = label.split(" ").filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
  return initials || label.slice(0, 1).toUpperCase();
}

function approximateSvgLineCapacity(fontSize: number, maxWidth: number): number {
  return Math.max(8, Math.floor(maxWidth / (fontSize * 0.56)));
}

function truncateSvgLine(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value;
  }

  if (maxChars <= 1) {
    return "…";
  }

  return `${value.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
}

function buildKeepsakeTitleLayout(requester: string, signer: string): {
  titleFontSize: number;
  titleStartY: number;
  subtitleY: number;
  titleTspans: string;
} {
  const safeRequester = requester.trim() || "Someone";
  const safeSigner = signer.trim() || "Autograph";
  const combined = `${safeRequester} ↔ ${safeSigner}`;
  const maxTitleWidth = 980;

  for (const size of [58, 54, 50, 46]) {
    const capacity = approximateSvgLineCapacity(size, maxTitleWidth);
    if (combined.length <= capacity) {
      return {
        titleFontSize: size,
        titleStartY: 200,
        subtitleY: 244,
        titleTspans: `<tspan x="100" dy="0">${escapeSvgText(combined)}</tspan>`,
      };
    }
  }

  const twoLineSize = 50;
  const capacity = approximateSvgLineCapacity(twoLineSize, maxTitleWidth);
  const left = truncateSvgLine(safeRequester, capacity);
  const right = truncateSvgLine(safeSigner, Math.max(8, capacity - 2));

  return {
    titleFontSize: twoLineSize,
    titleStartY: 176,
    subtitleY: 276,
    titleTspans: [
      `<tspan x="100" dy="0">${escapeSvgText(left)}</tspan>`,
      `<tspan x="100" dy="56">${escapeSvgText(`↔ ${right}`)}</tspan>`,
    ].join(""),
  };
}

export function buildKeepsakeShareText(copy: AutographExchangeCopy, item: AutographRequest): string {
  const signedOn = formatRelativeDate(item.signedAt ?? item.createdAt, copy);

  return [
    `${item.requesterDisplayName} ↔ ${item.signerDisplayName}`,
    "",
    `“${item.signatureText ?? ""}”`,
    "",
    `${copy.keepsakeMessageLabel}: ${item.message}`,
    `${copy.signedPrefix} ${signedOn}`,
    "",
    "Shared from Autograph Exchange",
  ].join("\n");
}

export function buildKeepsakeSvg(copy: AutographExchangeCopy, item: AutographRequest): string {
  const signerName = item.signerDisplayName.trim() || "Autograph";
  const title = escapeSvgText(`${item.requesterDisplayName} ↔ ${item.signerDisplayName}`);
  const titleLayout = buildKeepsakeTitleLayout(item.requesterDisplayName, item.signerDisplayName);
  const subtitle = escapeSvgText(copy.socialKeepsakeLabel);
  const footer = escapeSvgText(`${copy.signedPrefix} ${formatRelativeDate(item.signedAt ?? item.createdAt, copy)}`);
  const signedDate = new Date(item.signedAt ?? item.createdAt);
  const signedDateLabel = escapeSvgText(
    Number.isFinite(signedDate.getTime())
      ? signedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "A timeless keepsake",
  );
  const ceremonialLine = escapeSvgText(`Curated in the Royal Keepsake Archive · ${signedDateLabel}`);
  const quoteLines = wrapSvgText(item.signatureText ?? "", 28).slice(0, 4).map(escapeSvgText);
  const messageLines = wrapSvgText(item.message, 38).slice(0, 4).map(escapeSvgText);

  const quoteTspans = quoteLines.map((line, index) => `<tspan x="104" dy="${index === 0 ? 0 : 38}">${line}</tspan>`).join("");
  const messageTspans = messageLines.map((line, index) => `<tspan x="104" dy="${index === 0 ? 0 : 27}">${line}</tspan>`).join("");

  const seed = createSvgSeed(`${item.id}:${signerName}:${item.signatureText ?? ""}`);
  const initials = escapeSvgText(createSvgInitials(signerName));
  const hueStart = 132 + (seed % 20);
  const hueEnd = hueStart + 22 + (seed % 16);
  const sigStrokeA = createSvgStroke(seed, 9);
  const sigStrokeB = createSvgStroke(seed, 23);
  const sigFlourish = createSvgFlourish(seed);
  const signatureLabel = escapeSvgText(signerName);
  const signatureSize = Math.max(46, 68 - Math.min(signatureLabel.length, 20));
  const signatureTilt = -8 - (seed % 6);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8f0df"/>
      <stop offset="48%" stop-color="#efe3cc"/>
      <stop offset="100%" stop-color="#e5d3b4"/>
    </linearGradient>
    <radialGradient id="glow" cx="80%" cy="12%" r="68%">
      <stop offset="0%" stop-color="rgba(176, 126, 54, 0.34)"/>
      <stop offset="100%" stop-color="rgba(176, 126, 54, 0)"/>
    </radialGradient>
    <linearGradient id="paper" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fffdf8"/>
      <stop offset="100%" stop-color="#f6eddc"/>
    </linearGradient>
    <linearGradient id="royal-gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6f4d1e"/>
      <stop offset="48%" stop-color="#cc9b4f"/>
      <stop offset="100%" stop-color="#7b5420"/>
    </linearGradient>
    <pattern id="royal-weave" patternUnits="userSpaceOnUse" width="22" height="22">
      <path d="M 0 11 L 22 11 M 11 0 L 11 22" stroke="rgba(149, 110, 47, 0.08)" stroke-width="0.9"/>
      <path d="M 0 0 L 22 22 M 22 0 L 0 22" stroke="rgba(149, 110, 47, 0.05)" stroke-width="0.8"/>
    </pattern>
    <linearGradient id="sig-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="hsl(${hueStart} 72% 34%)"/>
      <stop offset="100%" stop-color="hsl(${hueEnd} 66% 28%)"/>
    </linearGradient>
    <linearGradient id="foil-sheen" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(255, 242, 204, 0.12)"/>
      <stop offset="45%" stop-color="rgba(255, 236, 188, 0.45)"/>
      <stop offset="55%" stop-color="rgba(255, 248, 226, 0.62)"/>
      <stop offset="100%" stop-color="rgba(255, 232, 176, 0.1)"/>
    </linearGradient>
    <radialGradient id="foil-bloom" cx="30%" cy="22%" r="66%">
      <stop offset="0%" stop-color="rgba(255, 233, 180, 0.32)"/>
      <stop offset="100%" stop-color="rgba(255, 233, 180, 0)"/>
    </radialGradient>
    <radialGradient id="sig-accent" cx="32%" cy="38%" r="74%">
      <stop offset="0%" stop-color="hsla(${hueStart} 74% 42% / 0.2)"/>
      <stop offset="100%" stop-color="hsla(${hueEnd} 66% 26% / 0)"/>
    </radialGradient>
    <linearGradient id="title-ink" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1f3f34"/>
      <stop offset="56%" stop-color="#2f5f52"/>
      <stop offset="100%" stop-color="#1f3f34"/>
    </linearGradient>
    <filter id="title-shadow" x="-20%" y="-30%" width="140%" height="180%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.2" flood-color="rgba(81, 57, 19, 0.22)"/>
    </filter>
  </defs>
  <rect width="1200" height="1500" rx="62" fill="url(#bg)"/>
  <rect width="1200" height="1500" rx="62" fill="url(#glow)"/>
  <rect x="38" y="38" width="1124" height="1424" rx="52" fill="none" stroke="url(#royal-gold)" stroke-width="4"/>
  <rect x="66" y="66" width="1068" height="1368" rx="42" fill="url(#paper)" stroke="#d6bd95" stroke-width="2"/>
  <rect x="66" y="66" width="1068" height="1368" rx="42" fill="url(#royal-weave)" opacity="0.24"/>
  <path d="M 86 118 C 116 82, 170 82, 200 118" fill="none" stroke="url(#royal-gold)" stroke-width="2.2"/>
  <path d="M 1114 118 C 1084 82, 1030 82, 1000 118" fill="none" stroke="url(#royal-gold)" stroke-width="2.2"/>
  <path d="M 86 1382 C 116 1418, 170 1418, 200 1382" fill="none" stroke="url(#royal-gold)" stroke-width="2.2"/>
  <path d="M 1114 1382 C 1084 1418, 1030 1418, 1000 1382" fill="none" stroke="url(#royal-gold)" stroke-width="2.2"/>

  <text x="100" y="132" fill="#74521f" font-family="Avenir Next, Nunito Sans, sans-serif" font-size="23" font-weight="800" letter-spacing="5">AUTOGRAPH EXCHANGE</text>
  <path d="M 100 146 L 516 146" stroke="url(#royal-gold)" stroke-width="2" opacity="0.7"/>
  <text x="100" y="${titleLayout.titleStartY}" fill="url(#title-ink)" font-family="Avenir Next, Nunito Sans, sans-serif" font-size="${titleLayout.titleFontSize}" font-weight="800" filter="url(#title-shadow)">${titleLayout.titleTspans}</text>
  <text x="100" y="${titleLayout.subtitleY}" fill="#6e5a35" font-family="Avenir Next, Nunito Sans, sans-serif" font-size="24" font-weight="700">${subtitle}</text>
  <path d="M 100 ${titleLayout.subtitleY + 14} L 424 ${titleLayout.subtitleY + 14}" stroke="url(#royal-gold)" stroke-width="1.7" opacity="0.65"/>
  <path d="M 1014 106 L 1030 82 L 1046 106 L 1062 82 L 1078 106" fill="none" stroke="url(#royal-gold)" stroke-width="3" stroke-linecap="round"/>
  <circle cx="1046" cy="74" r="7" fill="url(#royal-gold)"/>

  <rect x="84" y="286" width="1032" height="420" rx="34" fill="#fffdfa" stroke="#d8c39b" stroke-width="2"/>
  <rect x="84" y="286" width="1032" height="420" rx="34" fill="url(#foil-bloom)" opacity="0.35"/>
  <path d="M 130 324 L 1090 324" stroke="url(#foil-sheen)" stroke-width="2.6" opacity="0.78"/>
  <text x="104" y="336" fill="#7b652f" font-family="Avenir Next, Nunito Sans, sans-serif" font-size="20" font-weight="800" letter-spacing="3">THE AUTOGRAPH</text>
  <g opacity="0.11" transform="translate(600 508)">
    <circle cx="0" cy="0" r="108" fill="none" stroke="url(#royal-gold)" stroke-width="4"/>
    <circle cx="0" cy="0" r="84" fill="none" stroke="url(#royal-gold)" stroke-width="2.4"/>
    <path d="M -44 -20 L 0 -58 L 44 -20 L 28 -20 L 28 32 L -28 32 L -28 -20 Z" fill="none" stroke="url(#royal-gold)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M -34 -6 L -12 -26 L 0 -14 L 12 -26 L 34 -6" fill="none" stroke="url(#royal-gold)" stroke-width="2.2" stroke-linecap="round"/>
    <text x="0" y="68" text-anchor="middle" fill="#7b5a24" font-family="Didot, Baskerville, serif" font-size="28" font-weight="700" letter-spacing="2">AE</text>
  </g>
  <text x="104" y="412" fill="#1f3e33" font-family="Georgia, Baskerville, serif" font-size="55" font-weight="600">${quoteTspans}</text>

  <rect x="84" y="730" width="1032" height="268" rx="32" fill="#fdf8f0" stroke="#d8c39b" stroke-width="2"/>
  <text x="104" y="780" fill="#7b652f" font-family="Avenir Next, Nunito Sans, sans-serif" font-size="20" font-weight="800" letter-spacing="3">${escapeSvgText(copy.keepsakeMessageLabel.toUpperCase())}</text>
  <text x="104" y="838" fill="#334c42" font-family="Avenir Next, Nunito Sans, sans-serif" font-size="31" font-weight="600">${messageTspans}</text>

  <rect x="84" y="1024" width="1032" height="258" rx="32" fill="#f8edd9" stroke="#d2b47f" stroke-width="2"/>
  <rect x="84" y="1024" width="1032" height="258" rx="32" fill="url(#foil-bloom)" opacity="0.22"/>
  <path d="M 126 1060 L 1080 1060" stroke="url(#foil-sheen)" stroke-width="2" opacity="0.72"/>
  <text x="104" y="1074" fill="#7b652f" font-family="Avenir Next, Nunito Sans, sans-serif" font-size="20" font-weight="800" letter-spacing="3">VISUAL SIGNATURE</text>
  <circle cx="349" cy="1148" r="38" fill="#f3e2bd" stroke="url(#royal-gold)" stroke-width="2"/>
  <text x="334" y="1158" fill="#6b4b1f" font-family="Didot, Baskerville, serif" font-size="28" font-weight="700">AE</text>
  <rect x="430" y="1068" width="666" height="190" rx="24" fill="#fffaf2" stroke="#d8c39b" stroke-width="1.5"/>
  <ellipse cx="520" cy="1158" rx="104" ry="56" fill="url(#sig-accent)"/>
  <text x="470" y="1168" fill="url(#sig-gradient)" opacity="0.2" font-size="60" font-weight="700" letter-spacing="0.08em" style="font-family: 'Didot', 'Baskerville', 'Times New Roman', serif;">${initials}</text>
  <text x="456" y="1186" fill="url(#sig-gradient)" font-size="${signatureSize}" font-style="italic" font-weight="500" letter-spacing="0.35" transform="rotate(${signatureTilt} 468 1176)" style="font-family: 'Snell Roundhand', 'Segoe Script', 'Brush Script MT', 'Apple Chancery', cursive;">${signatureLabel}</text>
  <path d="${sigStrokeA}" transform="translate(410 1044)" stroke="url(#sig-gradient)" fill="none" stroke-width="3.1" stroke-linecap="round" opacity="0.94"/>
  <path d="${sigStrokeB}" transform="translate(410 1044)" stroke="url(#sig-gradient)" fill="none" stroke-width="2.1" stroke-linecap="round" opacity="0.78"/>
  <path d="${sigFlourish}" transform="translate(410 1044)" stroke="url(#sig-gradient)" fill="none" stroke-width="1.8" stroke-linecap="round" opacity="0.58"/>

  <text x="104" y="1120" fill="#4f3f22" font-family="Avenir Next, Nunito Sans, sans-serif" font-size="18" font-weight="700" letter-spacing="2">${escapeSvgText(copy.keepsakeMemoryLabel.toUpperCase())}</text>
  <text x="104" y="1160" fill="#243d33" font-family="Avenir Next, Nunito Sans, sans-serif" font-size="28" font-weight="700">${footer}</text>
  <text x="104" y="1200" fill="#4a5e56" font-family="Avenir Next, Nunito Sans, sans-serif" font-size="22" font-weight="600">${escapeSvgText(copy.savedInCollectionLabel)}</text>
  <text x="104" y="1240" fill="#7f6330" font-family="'Snell Roundhand', 'Segoe Script', 'Brush Script MT', 'Apple Chancery', cursive" font-size="28" font-weight="600" letter-spacing="0.8">${ceremonialLine}</text>
</svg>`;
}

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

export function buildMomentumState({
  copy,
  hasProfile,
  outboxCount,
  archiveCount,
  lastSignedRequestId,
}: {
  copy: AutographExchangeCopy;
  hasProfile: boolean;
  outboxCount: number;
  archiveCount: number;
  lastSignedRequestId: string | null;
}): MomentumState {
  const requestCount = outboxCount + archiveCount;
  const steps: MomentumStep[] = [
    {
      id: "profile",
      label: copy.journeyProfileLabel,
      value: hasProfile ? "Ready" : "Needed",
      completed: hasProfile,
    },
    {
      id: "request",
      label: copy.journeyRequestLabel,
      value: requestCount > 0 ? `${requestCount} total` : "Start with 1",
      completed: requestCount > 0,
    },
    {
      id: "collect",
      label: copy.journeyCollectLabel,
      value: archiveCount > 0 ? `${archiveCount} saved` : "Waiting for your first one",
      completed: archiveCount > 0,
    },
  ];
  const completionPercent = Math.round((steps.filter((step) => step.completed).length / steps.length) * 100);

  if (!hasProfile) {
    return {
      completionPercent,
      steps,
      nextTitle: "Save your profile to unlock the full exchange",
      nextDetail: "Once your name and role are saved, asking and replying becomes quick, personal, and recognizable.",
      celebrationTitle: null,
      celebrationDetail: null,
    };
  }

  if (requestCount === 0) {
    return {
      completionPercent,
      steps,
      nextTitle: "Send your first request",
      nextDetail: "One thoughtful request is enough to start momentum. People are much more likely to reply when the note feels personal.",
      celebrationTitle: null,
      celebrationDetail: null,
    };
  }

  if (archiveCount === 0) {
    return {
      completionPercent,
      steps,
      nextTitle: "Collect your first signed autograph",
      nextDetail: "The moment the first reply arrives, your archive turns into a keepsake collection instead of just a workflow.",
      celebrationTitle: null,
      celebrationDetail: null,
    };
  }

  if (archiveCount < 3) {
    const remaining = 3 - archiveCount;
    return {
      completionPercent,
      steps,
      nextTitle: "Build your first keepsake set",
      nextDetail: `${remaining} more ${pluralize(remaining, "autograph")} will complete your first collection of 3.`,
      celebrationTitle: lastSignedRequestId ? copy.celebrationTitle : null,
      celebrationDetail: lastSignedRequestId ? copy.celebrationDetail : null,
    };
  }

  if (archiveCount < 10) {
    const remaining = 10 - archiveCount;
    return {
      completionPercent,
      steps,
      nextTitle: "Grow a collection people remember",
      nextDetail: `${remaining} more ${pluralize(remaining, "autograph")} will bring you to 10 saved keepsakes.`,
      celebrationTitle: lastSignedRequestId ? copy.celebrationTitle : null,
      celebrationDetail: lastSignedRequestId ? copy.celebrationDetail : null,
    };
  }

  return {
    completionPercent,
    steps,
    nextTitle: "Keep your archive alive",
    nextDetail: "Ask someone new, revisit older notes, and keep building a collection that feels meaningful over time.",
    celebrationTitle: lastSignedRequestId ? copy.celebrationTitle : null,
    celebrationDetail: lastSignedRequestId ? copy.celebrationDetail : null,
  };
}
