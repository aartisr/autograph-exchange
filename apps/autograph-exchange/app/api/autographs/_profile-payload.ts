import { NextResponse } from "next/server";
import type { AutographProfile } from "@aartisr/autograph-contract";

const DATA_IMAGE_AVATAR_PATTERN = /^data:(image\/(?:png|jpe?g|webp|gif));base64,([a-z0-9+/=]+)$/i;

type ProfileWithAvatar = Pick<AutographProfile, "id" | "avatarUrl">;

export function isDataImageAvatar(value: string | undefined): boolean {
  return typeof value === "string" && DATA_IMAGE_AVATAR_PATTERN.test(value.trim());
}

export function profileAvatarRoute(profileId: string): string {
  return `/api/autographs/profiles/${encodeURIComponent(profileId)}/avatar`;
}

export function withDisplayAvatarUrl<T extends ProfileWithAvatar>(profile: T): T {
  if (!isDataImageAvatar(profile.avatarUrl)) {
    return profile;
  }

  return {
    ...profile,
    avatarUrl: profileAvatarRoute(profile.id),
  };
}

export function withDisplayAvatarUrls<T extends ProfileWithAvatar>(profiles: T[]): T[] {
  return profiles.map(withDisplayAvatarUrl);
}

export async function withDisplayAvatarJsonResponse<T extends ProfileWithAvatar | ProfileWithAvatar[]>(
  response: Response,
): Promise<Response> {
  if (!response.ok) {
    return response;
  }

  const payload = (await response.json()) as T;
  const displayPayload = Array.isArray(payload) ? withDisplayAvatarUrls(payload) : withDisplayAvatarUrl(payload);

  return NextResponse.json(displayPayload, {
    status: response.status,
    statusText: response.statusText,
  });
}

export function parseDataImageAvatar(value: string | undefined): { mimeType: string; bytes: Buffer } | null {
  if (typeof value !== "string") {
    return null;
  }

  const match = DATA_IMAGE_AVATAR_PATTERN.exec(value.trim());
  if (!match) {
    return null;
  }

  return {
    mimeType: match[1].toLowerCase(),
    bytes: Buffer.from(match[2], "base64"),
  };
}
