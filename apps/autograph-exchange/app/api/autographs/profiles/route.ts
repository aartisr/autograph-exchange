import {
  createAutographProfilesGetHandler,
  createAutographProfilesPutHandler,
} from "@aartisr/autograph-core";
import { isAutographAdminUserId, requireSessionUserId } from "../_session";
import { autographService } from "../_service";

const config = {
  service: autographService,
  getUserId: requireSessionUserId,
  isAdmin: isAutographAdminUserId,
};

export const GET = createAutographProfilesGetHandler(config);
export const PUT = createAutographProfilesPutHandler(config);
