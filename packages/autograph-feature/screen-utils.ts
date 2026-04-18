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

export function rolePairLabel(request: AutographRequest): string {
  return `${request.requesterRole} to ${request.signerRole}`;
}

export function signerSearchLabel(profile: AutographProfile): string {
  return `${profile.displayName} ${titleCaseRole(profile.role)}`;
}

export function buildSignerSearchEntries(profiles: AutographProfile[]): SignerSearchEntry[] {
  return profiles.map((profile) => {
    const displayNameLower = profile.displayName.toLowerCase();
    const roleLower = titleCaseRole(profile.role).toLowerCase();

    return {
      profile,
      displayNameLower,
      roleLower,
      combinedLower: `${displayNameLower} ${roleLower}`.trim(),
    };
  });
}

export function signerMatchesQuery(profile: AutographProfile, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    profile.displayName,
    profile.role,
    titleCaseRole(profile.role),
    signerSearchLabel(profile),
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
    return "Your first signed autograph will start a collection you can keep coming back to.";
  }

  if (archiveCount === 1) {
    return "Your first keepsake is in. This is where your most meaningful signed notes begin to live.";
  }

  if (archiveCount < 5) {
    return `You have ${archiveCount} signed keepsakes. Your collection is starting to feel personal and memorable.`;
  }

  if (archiveCount < 10) {
    return `You have ${archiveCount} signed keepsakes. This is becoming a real archive of meaningful messages.`;
  }

  return `You have ${archiveCount} signed keepsakes. Your archive now feels like a living collection worth revisiting again and again.`;
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
  const title = escapeSvgText(`${item.requesterDisplayName} ↔ ${item.signerDisplayName}`);
  const subtitle = escapeSvgText(copy.socialKeepsakeLabel);
  const footer = escapeSvgText(`${copy.signedPrefix} ${formatRelativeDate(item.signedAt ?? item.createdAt, copy)}`);
  const quoteLines = wrapSvgText(item.signatureText ?? "", 30).slice(0, 4).map(escapeSvgText);
  const messageLines = wrapSvgText(item.message, 34).slice(0, 3).map(escapeSvgText);

  const quoteTspans = quoteLines.map((line, index) => `<tspan x="72" dy="${index === 0 ? 0 : 34}">${line}</tspan>`).join("");
  const messageTspans = messageLines.map((line, index) => `<tspan x="72" dy="${index === 0 ? 0 : 24}">${line}</tspan>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f6fbf8"/>
      <stop offset="55%" stop-color="#eef7f3"/>
      <stop offset="100%" stop-color="#e4f1ec"/>
    </linearGradient>
    <radialGradient id="glow" cx="80%" cy="10%" r="65%">
      <stop offset="0%" stop-color="rgba(134, 186, 162, 0.42)"/>
      <stop offset="100%" stop-color="rgba(134, 186, 162, 0)"/>
    </radialGradient>
    <linearGradient id="panel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f7fbf9"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="1500" rx="56" fill="url(#bg)"/>
  <rect width="1200" height="1500" rx="56" fill="url(#glow)"/>
  <rect x="56" y="56" width="1088" height="1388" rx="44" fill="none" stroke="#c8ded3" stroke-width="2"/>
  <text x="72" y="112" fill="#7c5521" font-family="Avenir Next, Nunito Sans, sans-serif" font-size="26" font-weight="800" letter-spacing="4">AUTOGRAPH EXCHANGE</text>
  <text x="72" y="176" fill="#16392f" font-family="Avenir Next, Nunito Sans, sans-serif" font-size="58" font-weight="800">${title}</text>
  <text x="72" y="222" fill="#517064" font-family="Avenir Next, Nunito Sans, sans-serif" font-size="26" font-weight="700">${subtitle}</text>
  <rect x="72" y="284" width="1056" height="560" rx="36" fill="url(#panel)" stroke="#d6e7df" stroke-width="2"/>
  <text x="72" y="346" fill="#6f8d80" font-family="Avenir Next, Nunito Sans, sans-serif" font-size="22" font-weight="800" letter-spacing="3">THE AUTOGRAPH</text>
  <text x="72" y="440" fill="#14352d" font-family="Georgia, Baskerville, serif" font-size="52" font-weight="600">${quoteTspans}</text>
  <rect x="72" y="884" width="1056" height="220" rx="32" fill="#fbfdfc" stroke="#dceae4" stroke-width="2"/>
  <text x="72" y="944" fill="#6f8d80" font-family="Avenir Next, Nunito Sans, sans-serif" font-size="22" font-weight="800" letter-spacing="3">${escapeSvgText(copy.keepsakeMessageLabel.toUpperCase())}</text>
  <text x="72" y="1004" fill="#355246" font-family="Avenir Next, Nunito Sans, sans-serif" font-size="32" font-weight="600">${messageTspans}</text>
  <rect x="72" y="1140" width="1056" height="180" rx="32" fill="#f5faf7" stroke="#dceae4" stroke-width="2"/>
  <text x="72" y="1200" fill="#6f8d80" font-family="Avenir Next, Nunito Sans, sans-serif" font-size="22" font-weight="800" letter-spacing="3">${escapeSvgText(copy.keepsakeMemoryLabel.toUpperCase())}</text>
  <text x="72" y="1260" fill="#14352d" font-family="Avenir Next, Nunito Sans, sans-serif" font-size="30" font-weight="700">${footer}</text>
  <text x="72" y="1306" fill="#4f6a60" font-family="Avenir Next, Nunito Sans, sans-serif" font-size="24" font-weight="600">${escapeSvgText(copy.savedInCollectionLabel)}</text>
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
