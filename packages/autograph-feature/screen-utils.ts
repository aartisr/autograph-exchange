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
