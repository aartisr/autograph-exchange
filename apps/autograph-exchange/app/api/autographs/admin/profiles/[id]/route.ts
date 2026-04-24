import { createAutographAdminProfilePutHandler } from "@aartisr/autograph-core";
import { isAutographAdminUserId, requireSessionUserId } from "../../../_session";
import { autographService } from "../../../_service";

const config = {
  service: autographService,
  getUserId: requireSessionUserId,
  isAdmin: isAutographAdminUserId,
};

export const PUT = createAutographAdminProfilePutHandler(config);
