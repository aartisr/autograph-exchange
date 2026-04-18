import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createAutographService } from "@aartisr/autograph-core";

const originalCwd = process.cwd();

describe("file-backed autograph storage", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), "autograph-exchange-storage-"));
    process.chdir(tempRoot);
    vi.resetModules();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("persists profiles across storage instances", async () => {
    const { createFileAutographStorage } = await import("../lib/file-storage");
    const serviceA = createAutographService(createFileAutographStorage());

    await serviceA.upsertAutographProfile("aarti@example.com", {
      displayName: "Aarti S Ravikumar",
      role: "teacher",
    });

    const serviceB = createAutographService(createFileAutographStorage());
    const profiles = await serviceB.listAutographProfiles();

    expect(profiles).toHaveLength(1);
    expect(profiles[0]).toMatchObject({
      userId: "aarti@example.com",
      displayName: "Aarti S Ravikumar",
      role: "teacher",
    });
  });

  it("updates the newest saved profile for the same user instead of creating a ghost duplicate", async () => {
    const { createFileAutographStorage } = await import("../lib/file-storage");
    const service = createAutographService(createFileAutographStorage());

    const first = await service.upsertAutographProfile("aarti@example.com", {
      displayName: "Aarti Ravikumar",
      role: "student",
    });

    const second = await service.upsertAutographProfile("aarti@example.com", {
      displayName: "Aarti S Ravikumar",
      role: "teacher",
    });

    const profiles = await service.listAutographProfiles();

    expect(first.id).toBe(second.id);
    expect(profiles).toHaveLength(1);
    expect(profiles[0]).toMatchObject({
      userId: "aarti@example.com",
      displayName: "Aarti S Ravikumar",
      role: "teacher",
    });
  });
});
