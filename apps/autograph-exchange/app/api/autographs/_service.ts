import { createAutographService } from "@aartisr/autograph-core";
import { createAutographStorageFromEnvironment } from "@/lib/autograph-storage";

export const autographService = createAutographService(createAutographStorageFromEnvironment());
