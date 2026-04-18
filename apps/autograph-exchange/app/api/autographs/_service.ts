import { createAutographService } from "@autograph-exchange/core";
import { createFileAutographStorage } from "@/lib/file-storage";

export const autographService = createAutographService(createFileAutographStorage());
