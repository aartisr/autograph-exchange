import {
  createAutographProfilesGetHandler,
  createAutographProfilesPutHandler,
} from "@autograph-exchange/core";
import { requireSessionUserId } from "../_session";
import { autographService } from "../_service";

const config = {
  service: autographService,
  getUserId: requireSessionUserId,
};

export const GET = createAutographProfilesGetHandler(config);
export const PUT = createAutographProfilesPutHandler(config);
