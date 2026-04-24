import { describe, expect, it } from "vitest";
import {
  parseDataImageAvatar,
  profileAvatarRoute,
  withDisplayAvatarJsonResponse,
  withDisplayAvatarUrl,
} from "../app/api/autographs/_profile-payload";
import type { PublicAutographProfile } from "@aartisr/autograph-contract";

describe("public profile payload helpers", () => {
  it("replaces inline data avatars with stable avatar routes", () => {
    const profile: PublicAutographProfile = {
      id: "profile-1",
      displayName: "Asha Raman",
      role: "student",
      avatarUrl: "data:image/png;base64,aGVsbG8=",
      updatedAt: "2026-04-18T10:00:00.000Z",
    };

    expect(withDisplayAvatarUrl(profile).avatarUrl).toBe(profileAvatarRoute("profile-1"));
  });

  it("decodes supported data image avatars for the image route", () => {
    const avatar = parseDataImageAvatar("data:image/jpeg;base64,aGVsbG8=");

    expect(avatar?.mimeType).toBe("image/jpeg");
    expect(avatar?.bytes.toString("utf8")).toBe("hello");
  });

  it("rewrites successful JSON responses without changing the response status", async () => {
    const response = Response.json(
      [
        {
          id: "profile-1",
          displayName: "Asha Raman",
          role: "student",
          avatarUrl: "data:image/png;base64,aGVsbG8=",
          updatedAt: "2026-04-18T10:00:00.000Z",
        },
      ] satisfies PublicAutographProfile[],
      { status: 201 },
    );

    const displayResponse = await withDisplayAvatarJsonResponse<PublicAutographProfile[]>(response);

    expect(displayResponse.status).toBe(201);
    await expect(displayResponse.json()).resolves.toMatchObject([
      {
        avatarUrl: profileAvatarRoute("profile-1"),
      },
    ]);
  });
});
