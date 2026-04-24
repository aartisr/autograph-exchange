import {
  createAutographProfileGetHandler,
  createAutographProfilePutHandler,
} from "@aartisr/autograph-core";
import { isAutographAdminUserId, requireSessionUserId } from "../../_session";
import { autographService } from "../../_service";

const config = {
  service: autographService,
  getUserId: requireSessionUserId,
  isAdmin: isAutographAdminUserId,
};

export const GET = createAutographProfileGetHandler(config);
export const PUT = createAutographProfilePutHandler(config);
