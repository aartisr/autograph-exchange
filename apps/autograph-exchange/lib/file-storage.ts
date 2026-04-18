import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AutographStorage, AutographStorageContext, ProfileEntry, RequestEntry } from "@autograph-exchange/core";

type FileStore = {
  profiles?: ProfileEntry[];
  requests?: RequestEntry[];
  autograph_profiles?: ProfileEntry[];
  autograph_requests?: RequestEntry[];
};

const DATA_FILE = path.join(process.cwd(), ".data", "autograph-exchange.json");

let writeQueue: Promise<void> = Promise.resolve();

async function ensureStoreFile() {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
}

async function readStore(): Promise<FileStore> {
  await ensureStoreFile();

  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as FileStore;
    if (typeof parsed !== "object" || !parsed) {
      return {};
    }

    return {
      profiles: Array.isArray(parsed.profiles)
        ? parsed.profiles
        : Array.isArray(parsed.autograph_profiles)
          ? parsed.autograph_profiles
          : [],
      requests: Array.isArray(parsed.requests)
        ? parsed.requests
        : Array.isArray(parsed.autograph_requests)
          ? parsed.autograph_requests
          : [],
    };
  } catch {
    return {};
  }
}

async function commitStore(store: FileStore) {
  await ensureStoreFile();
  await writeFile(DATA_FILE, JSON.stringify(store, null, 2));
}

function nextEntityId(prefix: "profile" | "request", entries: Array<{ id: string }>) {
  return `${prefix}-${entries.length + 1}`;
}

function withUserContext<T extends { id: string }>(entry: T, context?: AutographStorageContext) {
  if (!context?.userId) {
    return entry;
  }

  if ("userId" in entry && entry.userId && entry.userId !== context.userId) {
    return false;
  }

  return true;
}

export function createFileAutographStorage(): AutographStorage {
  return {
    async listProfiles(context?: AutographStorageContext): Promise<ProfileEntry[]> {
      const store = await readStore();
      const entries = Array.isArray(store.profiles) ? store.profiles : [];
      return entries.filter((entry) => withUserContext(entry, context)).map((entry) => ({ ...entry }));
    },

    async saveProfile(profile, _context?: AutographStorageContext): Promise<ProfileEntry> {
      let saved!: ProfileEntry;

      writeQueue = writeQueue.then(async () => {
        const store = await readStore();
        const entries = Array.isArray(store.profiles) ? store.profiles : [];
        if (profile.id) {
          store.profiles = entries.map((entry) => {
            if (entry.id !== profile.id) {
              return entry;
            }

            saved = { ...entry, ...profile, id: profile.id } as ProfileEntry;
            return saved;
          });
        } else {
          saved = {
            ...profile,
            id: nextEntityId("profile", entries),
          } as ProfileEntry;
          store.profiles = [...entries, saved];
        }
        await commitStore(store);
      });

      await writeQueue;
      if (!saved) {
        throw new Error(`Entry not found: profile:${profile.id}`);
      }
      return saved;
    },

    async listRequests(_context?: AutographStorageContext): Promise<RequestEntry[]> {
      const store = await readStore();
      const entries = Array.isArray(store.requests) ? store.requests : [];
      return entries.map((entry) => ({ ...entry }));
    },

    async createRequest(request, _context?: AutographStorageContext): Promise<RequestEntry> {
      let created!: RequestEntry;

      writeQueue = writeQueue.then(async () => {
        const store = await readStore();
        const entries = Array.isArray(store.requests) ? store.requests : [];
        created = {
          ...request,
          id: nextEntityId("request", entries),
        } as RequestEntry;
        store.requests = [...entries, created];
        await commitStore(store);
      });

      await writeQueue;
      return created;
    },

    async updateRequest(
      requestId: string,
      patch: Partial<Omit<RequestEntry, "id">>,
      _context?: AutographStorageContext,
    ): Promise<RequestEntry> {
      let updated!: RequestEntry;

      writeQueue = writeQueue.then(async () => {
        const store = await readStore();
        const entries = Array.isArray(store.requests) ? store.requests : [];
        store.requests = entries.map((entry) => {
          if (entry.id !== requestId) {
            return entry;
          }

          updated = {
            ...entry,
            ...patch,
            id: requestId,
          } as RequestEntry;
          return updated;
        });
        await commitStore(store);
      });

      await writeQueue;

      if (!updated) {
        throw new Error(`Entry not found: request:${requestId}`);
      }

      return updated;
    },
  };
}
