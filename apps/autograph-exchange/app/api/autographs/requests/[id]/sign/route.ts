import { createAutographSignPostHandler } from "@autograph-exchange/core";
import { requireSessionUserId } from "@/app/api/autographs/_session";
import { autographService } from "@/app/api/autographs/_service";

const config = {
  service: autographService,
  getUserId: requireSessionUserId,
};

export const POST = createAutographSignPostHandler(config);
