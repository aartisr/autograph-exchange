import { createAutographProfilePutHandler } from "@aartisr/autograph-core";
import { NextResponse } from "next/server";
import { withDisplayAvatarUrl } from "../../_profile-payload";
import { isAutographAdminUserId, requireSessionUserId } from "../../_session";
import { autographService } from "../../_service";

const config = {
  service: autographService,
  getUserId: requireSessionUserId,
  isAdmin: isAutographAdminUserId,
};

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const profile = await autographService.getPublicAutographProfile(params.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    return NextResponse.json(withDisplayAvatarUrl(profile));
  } catch {
    return NextResponse.json({ error: "Unable to load profile." }, { status: 500 });
  }
}

export const PUT = createAutographProfilePutHandler(config);
