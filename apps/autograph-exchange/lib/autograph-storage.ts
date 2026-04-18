import type { AutographStorage } from "@aartisr/autograph-core";
import { createFileAutographStorage } from "./file-storage";
import {
  describeAutographPersistenceConfig,
  resolveAutographPersistenceConfig,
  type AutographPersistenceReport,
} from "./persistence-config";
import { createSupabaseAutographStorage } from "./supabase-storage";

let didLogPersistenceDriver = false;

function logPersistenceDriver(report: AutographPersistenceReport) {
  if (didLogPersistenceDriver) {
    return;
  }

  didLogPersistenceDriver = true;
  console.info("[autograph-exchange] persistence", report);
}

export function createAutographStorageFromEnvironment(): AutographStorage {
  const config = resolveAutographPersistenceConfig();
  logPersistenceDriver(describeAutographPersistenceConfig(config));

  if (config.driver === "supabase") {
    return createSupabaseAutographStorage(config);
  }

  return createFileAutographStorage();
}
