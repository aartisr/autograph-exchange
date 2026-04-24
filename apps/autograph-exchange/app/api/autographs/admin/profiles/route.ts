import {
  createAutographAdminProfilesGetHandler,
  createAutographAdminProfilesPostHandler,
} from "@aartisr/autograph-core";
import { isAutographAdminUserId, requireSessionUserId } from "../../_session";
import { autographService } from "../../_service";

const config = {
  service: autographService,
  getUserId: requireSessionUserId,
  isAdmin: isAutographAdminUserId,
};

export const GET = createAutographAdminProfilesGetHandler(config);
export const POST = createAutographAdminProfilesPostHandler(config);
