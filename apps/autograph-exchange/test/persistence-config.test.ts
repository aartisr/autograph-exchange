import { describe, expect, it } from "vitest";
import {
  describeAutographPersistenceConfig,
  resolveAutographPersistenceConfig,
} from "../lib/persistence-config";

describe("autograph persistence config", () => {
  it("defaults to file persistence", () => {
    expect(resolveAutographPersistenceConfig({})).toEqual({ driver: "file" });
  });

  it("enables supabase via the driver flag", () => {
    expect(
      resolveAutographPersistenceConfig({
        AUTOGRAPH_PERSISTENCE_DRIVER: "supabase",
        AUTOGRAPH_SUPABASE_URL: "https://example.supabase.co",
        AUTOGRAPH_SUPABASE_KEY: "secret",
      }),
    ).toEqual({
      driver: "supabase",
      url: "https://example.supabase.co",
      key: "secret",
      schema: "public",
      profilesTable: "autograph_profiles",
      requestsTable: "autograph_requests",
    });
  });

  it("supports the convenience enable flag and shared supabase env fallbacks", () => {
    expect(
      resolveAutographPersistenceConfig({
        AUTOGRAPH_ENABLE_SUPABASE: "true",
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
        AUTOGRAPH_SUPABASE_SCHEMA: "app",
        AUTOGRAPH_SUPABASE_PROFILES_TABLE: "profiles",
        AUTOGRAPH_SUPABASE_REQUESTS_TABLE: "requests",
      }),
    ).toEqual({
      driver: "supabase",
      url: "https://example.supabase.co",
      key: "service-role",
      schema: "app",
      profilesTable: "profiles",
      requestsTable: "requests",
    });
  });

  it("fails fast when supabase is enabled without a url", () => {
    expect(() =>
      resolveAutographPersistenceConfig({
        AUTOGRAPH_ENABLE_SUPABASE: "true",
        AUTOGRAPH_SUPABASE_KEY: "secret",
      }),
    ).toThrow(/AUTOGRAPH_SUPABASE_URL|SUPABASE_URL/);
  });

  it("fails fast when supabase is enabled without a key", () => {
    expect(() =>
      resolveAutographPersistenceConfig({
        AUTOGRAPH_ENABLE_SUPABASE: "true",
        AUTOGRAPH_SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toThrow(/AUTOGRAPH_SUPABASE_KEY|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ANON_KEY/);
  });

  it("produces a safe startup report for supabase persistence", () => {
    expect(
      describeAutographPersistenceConfig({
        driver: "supabase",
        url: "https://project-ref.supabase.co",
        key: "secret",
        schema: "public",
        profilesTable: "autograph_profiles",
        requestsTable: "autograph_requests",
      }),
    ).toEqual({
      driver: "supabase",
      details: {
        mode: "supabase",
        url: "https://project-ref.supabase.co",
        schema: "public",
        profilesTable: "autograph_profiles",
        requestsTable: "autograph_requests",
      },
    });
  });
});
