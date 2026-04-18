import { createAutographService } from "@aartisr/autograph-core";
import { createFileAutographStorage } from "@/lib/file-storage";

export const autographService = createAutographService(createFileAutographStorage());
