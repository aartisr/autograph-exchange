import { createAutographPublicProfilesGetHandler } from "@aartisr/autograph-core";
import { requireSessionUserId } from "../_session";
import { autographService } from "../_service";

const config = {
  service: autographService,
  getUserId: requireSessionUserId,
};

export const dynamic = "force-dynamic";

export const GET = createAutographPublicProfilesGetHandler(config);
