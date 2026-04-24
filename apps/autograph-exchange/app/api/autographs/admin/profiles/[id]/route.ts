import { createAutographAdminProfilePutHandler } from "@aartisr/autograph-core";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withDisplayAvatarJsonResponse } from "../../../_profile-payload";
import { isAutographAdminUserId, requireAdminSessionUserId, requireSessionUserId } from "../../../_session";
import { autographService } from "../../../_service";

const config = {
  service: autographService,
  getUserId: requireSessionUserId,
  isAdmin: isAutographAdminUserId,
} as const;

const putAdminProfile = createAutographAdminProfilePutHandler(config);

function adminProfileErrorResponse(error: unknown): Response {
  if (error instanceof Error && error.message === "AUTH_REQUIRED") {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (error instanceof Error && error.message === "ADMIN_REQUIRED") {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }

  return NextResponse.json({ error: "Unable to load admin profile." }, { status: 500 });
}

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdminSessionUserId();
    const profile = (await autographService.listAutographProfiles()).find((item) => item.id === params.id);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    return adminProfileErrorResponse(error);
  }
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  return withDisplayAvatarJsonResponse(await putAdminProfile(request, context));
}
