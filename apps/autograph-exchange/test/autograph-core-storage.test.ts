import { describe, expect, it } from "vitest";
import { createAutographService, createModuleAutographStorage } from "@aartisr/autograph-core";

function createModuleStore() {
  const state = {
    autograph_profiles: [] as Array<Record<string, unknown> & { id: string }>,
    autograph_requests: [] as Array<Record<string, unknown> & { id: string }>,
  };

  return {
    state,
    async list<T extends { id: string }>(module: string, context?: { userId?: string }): Promise<T[]> {
      const entries = state[module as keyof typeof state] ?? [];
      if (!context?.userId) {
        return entries.map((entry) => ({ ...entry } as T));
      }

      return entries
        .filter((entry) => ("userId" in entry ? entry.userId === context.userId : true))
        .map((entry) => ({ ...entry } as T));
    },
    async create<T extends { id: string }>(module: string, data: Omit<T, "id">): Promise<T> {
      const entries = state[module as keyof typeof state] ?? [];
      const created = {
        ...data,
        id: `${module}-${entries.length + 1}`,
      } as T;
      entries.push(created as Record<string, unknown> & { id: string });
      return created;
    },
    async update<T extends { id: string }>(module: string, id: string, patch: Partial<Omit<T, "id">>): Promise<T> {
      const entries = state[module as keyof typeof state] ?? [];
      const index = entries.findIndex((entry) => entry.id === id);
      if (index < 0) {
        throw new Error(`Missing entry ${module}:${id}`);
      }

      const updated = {
        ...entries[index],
        ...patch,
        id,
      } as T;
      entries[index] = updated as Record<string, unknown> & { id: string };
      return updated;
    },
    async delete(module: string, id: string, context?: { userId?: string }): Promise<void> {
      const entries = state[module as keyof typeof state] ?? [];
      const index = entries.findIndex((entry) => entry.id === id);
      if (index < 0) {
        throw new Error(`Missing entry ${module}:${id}`);
      }

      const entry = entries[index];
      if (context?.userId && "userId" in entry && entry.userId !== context.userId) {
        throw new Error(`Missing entry ${module}:${id}`);
      }

      entries.splice(index, 1);
    },
  };
}

describe("createModuleAutographStorage", () => {
  it("lets a host-backed module store drive the autograph service end to end", async () => {
    const moduleStore = createModuleStore();
    const service = createAutographService(createModuleAutographStorage(moduleStore));

    const requester = await service.upsertAutographProfile("user-1", {
      displayName: "Aarti Ravikumar",
      role: "student",
      headline: "Student of meditation, music, and community learning",
      avatarUrl: "data:image/png;base64,iVBORw0KGgo=",
      subjects: ["Meditation", "Music"],
      interests: ["Service"],
    });

    const signer = await service.upsertAutographProfile("user-2", {
      displayName: "Ravikumar Raman",
      role: "teacher",
      headline: "Teacher and mentor",
      bio: "Guides students with patience and practical encouragement.",
      affiliation: "Forever Lotus",
      location: "Online",
      signaturePrompt: "Ask me for a memory or encouragement for your next step.",
    });

    const publicProfiles = await service.listPublicAutographProfiles();
    const request = await service.createAutographRequest("user-1", {
      signerProfileId: signer.id,
      message: "Thank you for teaching me with patience.",
    });

    const signed = await service.signAutographRequest("user-2", request.id, {
      signatureText: "Keep growing with courage.",
      visibility: "public",
    });

    expect(requester.userId).toBe("user-1");
    expect(requester.avatarUrl).toBe("data:image/png;base64,iVBORw0KGgo=");
    expect(requester.subjects).toEqual(["Meditation", "Music"]);
    expect(signer.userId).toBe("user-2");
    expect(signer.signaturePrompt).toBe("Ask me for a memory or encouragement for your next step.");
    expect(publicProfiles).toHaveLength(2);
    expect(publicProfiles[0]).not.toHaveProperty("userId");
    expect(signed.status).toBe("signed");
    expect(signed.signatureText).toBe("Keep growing with courage.");
    expect(moduleStore.state.autograph_profiles).toHaveLength(2);
    expect(moduleStore.state.autograph_requests).toHaveLength(1);

    const deleted = await service.deleteAutographProfile("admin-user", signer.id, {
      canManageAllProfiles: true,
    });
    expect(deleted.displayName).toBe("Ravikumar Raman");
    expect(moduleStore.state.autograph_profiles).toHaveLength(1);
    expect(moduleStore.state.autograph_requests).toHaveLength(1);
  });
});
