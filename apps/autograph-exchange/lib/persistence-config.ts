export type AutographFilePersistenceConfig = {
  driver: "file";
};

export type AutographSupabasePersistenceConfig = {
  driver: "supabase";
  url: string;
  key: string;
  schema: string;
  profilesTable: string;
  requestsTable: string;
};

export type AutographPersistenceConfig =
  | AutographFilePersistenceConfig
  | AutographSupabasePersistenceConfig;

export type AutographPersistenceReport =
  | {
      driver: "file";
      details: {
        mode: "local-file";
      };
    }
  | {
      driver: "supabase";
      details: {
        mode: "supabase";
        url: string;
        schema: string;
        profilesTable: string;
        requestsTable: string;
      };
    };

function isTruthy(value: string | undefined) {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function resolveDriver(env: NodeJS.ProcessEnv): AutographPersistenceConfig["driver"] {
  if (isTruthy(env.AUTOGRAPH_ENABLE_SUPABASE)) {
    return "supabase";
  }

  return env.AUTOGRAPH_PERSISTENCE_DRIVER?.trim().toLowerCase() === "supabase" ? "supabase" : "file";
}

export function resolveAutographPersistenceConfig(
  env: NodeJS.ProcessEnv = process.env,
): AutographPersistenceConfig {
  const driver = resolveDriver(env);

  if (driver === "file") {
    return { driver: "file" };
  }

  const url = env.AUTOGRAPH_SUPABASE_URL ?? env.SUPABASE_URL;
  const key =
    env.AUTOGRAPH_SUPABASE_KEY
    ?? env.AUTOGRAPH_SUPABASE_SERVICE_ROLE_KEY
    ?? env.SUPABASE_SERVICE_ROLE_KEY
    ?? env.SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("AUTOGRAPH_SUPABASE_URL or SUPABASE_URL is required when Supabase persistence is enabled.");
  }

  if (!key) {
    throw new Error(
      "AUTOGRAPH_SUPABASE_KEY, AUTOGRAPH_SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY is required when Supabase persistence is enabled.",
    );
  }

  return {
    driver: "supabase",
    url,
    key,
    schema: env.AUTOGRAPH_SUPABASE_SCHEMA ?? "public",
    profilesTable: env.AUTOGRAPH_SUPABASE_PROFILES_TABLE ?? "autograph_profiles",
    requestsTable: env.AUTOGRAPH_SUPABASE_REQUESTS_TABLE ?? "autograph_requests",
  };
}

function redactSupabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "invalid-url";
  }
}

export function describeAutographPersistenceConfig(
  config: AutographPersistenceConfig,
): AutographPersistenceReport {
  if (config.driver === "file") {
    return {
      driver: "file",
      details: {
        mode: "local-file",
      },
    };
  }

  return {
    driver: "supabase",
    details: {
      mode: "supabase",
      url: redactSupabaseUrl(config.url),
      schema: config.schema,
      profilesTable: config.profilesTable,
      requestsTable: config.requestsTable,
    },
  };
}
