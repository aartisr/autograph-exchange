import { createAutographProfilesPutHandler } from "@aartisr/autograph-core";
import { NextResponse } from "next/server";
import { withDisplayAvatarUrl } from "../_profile-payload";
import { isAutographAdminUserId, requireSessionUserId } from "../_session";
import { autographService } from "../_service";

const config = {
  service: autographService,
  getUserId: requireSessionUserId,
  isAdmin: isAutographAdminUserId,
};

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireSessionUserId();
    const profiles = await autographService.listAutographProfiles();
    return NextResponse.json(
      profiles.map((profile) => (profile.userId === userId ? profile : withDisplayAvatarUrl(profile))),
    );
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to load profiles." }, { status: 500 });
  }
}

export const PUT = createAutographProfilesPutHandler(config);
