import {
  createAutographRequestsGetHandler,
  createAutographRequestsPostHandler,
} from "@aartisr/autograph-core";
import { requireSessionUserId } from "../_session";
import { autographService } from "../_service";

const config = {
  service: autographService,
  getUserId: requireSessionUserId,
};

export const GET = createAutographRequestsGetHandler(config);
export const POST = createAutographRequestsPostHandler(config);
