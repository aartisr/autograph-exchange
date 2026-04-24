import {
  createAutographAdminProfilesGetHandler,
  createAutographAdminProfilesPostHandler,
} from "@aartisr/autograph-core";
import type { NextRequest } from "next/server";
import { withDisplayAvatarJsonResponse } from "../../_profile-payload";
import { isAutographAdminUserId, requireSessionUserId } from "../../_session";
import { autographService } from "../../_service";

const config = {
  service: autographService,
  getUserId: requireSessionUserId,
  isAdmin: isAutographAdminUserId,
} as const;

const getAdminProfiles = createAutographAdminProfilesGetHandler(config);
const postAdminProfile = createAutographAdminProfilesPostHandler(config);

export const dynamic = "force-dynamic";

export async function GET() {
  return withDisplayAvatarJsonResponse(await getAdminProfiles());
}

export async function POST(request: NextRequest) {
  return withDisplayAvatarJsonResponse(await postAdminProfile(request));
}
