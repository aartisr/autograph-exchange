import {
  AUTOGRAPH_PROFILES_MODULE,
  AUTOGRAPH_REQUESTS_MODULE,
  type AutographProfile,
  type AutographRequest,
  type AutographRole,
  type AutographVisibility,
  type CreateAutographRequestInput,
  type SignAutographRequestInput,
  type UpsertAutographProfileInput,
} from "../autograph-contract";

export type AutographEntity = { id: string; [key: string]: unknown };

export interface AutographStorageContext {
  userId?: string;
}

export interface AutographStorage {
  listProfiles(context?: AutographStorageContext): Promise<ProfileEntry[]>;
  saveProfile(
    profile: Omit<ProfileEntry, "id"> & Partial<Pick<ProfileEntry, "id">>,
    context?: AutographStorageContext,
  ): Promise<ProfileEntry>;
  listRequests(context?: AutographStorageContext): Promise<RequestEntry[]>;
  createRequest(request: Omit<RequestEntry, "id">, context?: AutographStorageContext): Promise<RequestEntry>;
  updateRequest(
    requestId: string,
    patch: Partial<Omit<RequestEntry, "id">>,
    context?: AutographStorageContext,
  ): Promise<RequestEntry>;
}

export interface AutographModuleStore {
  list<T extends AutographEntity>(module: string, context?: AutographStorageContext): Promise<T[]>;
  create<T extends AutographEntity>(
    module: string,
    data: Omit<T, "id">,
    context?: AutographStorageContext,
  ): Promise<T>;
  update<T extends AutographEntity>(
    module: string,
    id: string,
    data: Partial<Omit<T, "id">>,
    context?: AutographStorageContext,
  ): Promise<T>;
}

export interface AutographService {
  listAutographProfiles(): Promise<AutographProfile[]>;
  upsertAutographProfile(
    actorUserId: string,
    input: UpsertAutographProfileInput,
  ): Promise<AutographProfile>;
  listVisibleAutographRequests(actorUserId: string): Promise<AutographRequest[]>;
  createAutographRequest(
    actorUserId: string,
    input: CreateAutographRequestInput,
  ): Promise<AutographRequest>;
  signAutographRequest(
    actorUserId: string,
    requestId: string,
    input: SignAutographRequestInput,
  ): Promise<AutographRequest>;
}

export type ProfileEntry = AutographEntity & {
  userId: string;
  displayName: string;
  role: AutographRole;
  updatedAt: string;
};

export type RequestEntry = AutographEntity & {
  requesterUserId: string;
  requesterDisplayName: string;
  requesterRole: AutographRole;
  signerUserId: string;
  signerDisplayName: string;
  signerRole: AutographRole;
  message: string;
  status: "pending" | "signed";
  signatureText?: string;
  visibility?: AutographVisibility;
  createdAt: string;
  signedAt?: string;
};

function isRole(value: unknown): value is AutographRole {
  return value === "student" || value === "teacher";
}

function isVisibility(value: unknown): value is AutographVisibility {
  return value === "public" || value === "private";
}

function sanitizeDisplayName(value: string): string {
  return value.trim().slice(0, 80);
}

function sanitizeMessage(value: string): string {
  return value.trim().slice(0, 600);
}

function sanitizeSignature(value: string): string {
  return value.trim().slice(0, 240);
}

function normalizeProfile(entry: Partial<ProfileEntry>): AutographProfile | null {
  if (!entry.id || !entry.userId || !entry.displayName || !isRole(entry.role)) {
    return null;
  }

  return {
    id: entry.id,
    userId: entry.userId,
    displayName: entry.displayName,
    role: entry.role,
    updatedAt: entry.updatedAt || new Date(0).toISOString(),
  };
}

function normalizeRequest(entry: Partial<RequestEntry>): AutographRequest | null {
  if (
    !entry.id ||
    !entry.requesterUserId ||
    !entry.requesterDisplayName ||
    !isRole(entry.requesterRole) ||
    !entry.signerUserId ||
    !entry.signerDisplayName ||
    !isRole(entry.signerRole) ||
    !entry.message ||
    (entry.status !== "pending" && entry.status !== "signed") ||
    !entry.createdAt
  ) {
    return null;
  }

  return {
    id: entry.id,
    requesterUserId: entry.requesterUserId,
    requesterDisplayName: entry.requesterDisplayName,
    requesterRole: entry.requesterRole,
    signerUserId: entry.signerUserId,
    signerDisplayName: entry.signerDisplayName,
    signerRole: entry.signerRole,
    message: entry.message,
    status: entry.status,
    signatureText: entry.signatureText,
    visibility: isVisibility(entry.visibility) ? entry.visibility : undefined,
    createdAt: entry.createdAt,
    signedAt: entry.signedAt,
  };
}

function profileRecencyValue(profile: AutographProfile): number {
  const updatedAt = new Date(profile.updatedAt).getTime();
  if (Number.isFinite(updatedAt)) {
    return updatedAt;
  }

  const numericId = Number.parseInt(profile.id.replace(/\D+/g, ""), 10);
  return Number.isFinite(numericId) ? numericId : 0;
}

function collapseProfilesByUserId(profiles: AutographProfile[]): AutographProfile[] {
  const byUserId = new Map<string, AutographProfile>();

  for (const profile of profiles) {
    const existing = byUserId.get(profile.userId);
    if (!existing || profileRecencyValue(profile) >= profileRecencyValue(existing)) {
      byUserId.set(profile.userId, profile);
    }
  }

  return [...byUserId.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function createModuleAutographStorage(store: AutographModuleStore): AutographStorage {
  return {
    listProfiles(context) {
      return store.list<ProfileEntry>(AUTOGRAPH_PROFILES_MODULE, context);
    },

    async saveProfile(profile, context) {
      if (profile.id) {
        return store.update<ProfileEntry>(AUTOGRAPH_PROFILES_MODULE, profile.id, profile, context);
      }

      return store.create<ProfileEntry>(AUTOGRAPH_PROFILES_MODULE, profile, context);
    },

    listRequests(context) {
      return store.list<RequestEntry>(AUTOGRAPH_REQUESTS_MODULE, context);
    },

    createRequest(request, context) {
      return store.create<RequestEntry>(AUTOGRAPH_REQUESTS_MODULE, request, context);
    },

    updateRequest(requestId, patch, context) {
      return store.update<RequestEntry>(AUTOGRAPH_REQUESTS_MODULE, requestId, patch, context);
    },
  };
}

export function createAutographService(storage: AutographStorage): AutographService {
  return {
    async listAutographProfiles(): Promise<AutographProfile[]> {
      const entries = await storage.listProfiles();

      return collapseProfilesByUserId(
        entries
          .map((entry) => normalizeProfile(entry))
          .filter((entry): entry is AutographProfile => Boolean(entry)),
      );
    },

    async upsertAutographProfile(
      actorUserId: string,
      input: UpsertAutographProfileInput,
    ): Promise<AutographProfile> {
      const displayName = sanitizeDisplayName(input.displayName);

      if (!displayName) {
        throw new Error("Display name is required.");
      }

      if (!isRole(input.role)) {
        throw new Error("Role must be student or teacher.");
      }

      const now = new Date().toISOString();
      const existingEntries = await storage.listProfiles({ userId: actorUserId });
      const existing = existingEntries
        .map((entry) => normalizeProfile(entry))
        .filter((entry): entry is AutographProfile => Boolean(entry))
        .sort((a, b) => profileRecencyValue(b) - profileRecencyValue(a))[0];

      const saved = await storage.saveProfile(
        {
          id: existing?.id,
          userId: actorUserId,
          displayName,
          role: input.role,
          updatedAt: now,
        },
        { userId: actorUserId },
      );

      const normalized = normalizeProfile(saved);
      if (!normalized) {
        throw new Error("Unable to save profile.");
      }
      return normalized;
    },

    async listVisibleAutographRequests(actorUserId: string): Promise<AutographRequest[]> {
      const entries = await storage.listRequests();

      return entries
        .map((entry) => normalizeRequest(entry))
        .filter((entry): entry is AutographRequest => Boolean(entry))
        .filter((entry) => {
          const isParticipant = entry.requesterUserId === actorUserId || entry.signerUserId === actorUserId;
          const isPublicSigned = entry.status === "signed" && entry.visibility === "public";
          return isParticipant || isPublicSigned;
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async createAutographRequest(
      actorUserId: string,
      input: CreateAutographRequestInput,
    ): Promise<AutographRequest> {
      const signerUserId = input.signerUserId.trim();
      const message = sanitizeMessage(input.message);

      if (!signerUserId) {
        throw new Error("Signer is required.");
      }

      if (!message) {
        throw new Error("Message is required.");
      }

      if (signerUserId === actorUserId) {
        throw new Error("You cannot request your own autograph.");
      }

      const profiles = await this.listAutographProfiles();
      const requesterProfile = profiles.find((profile) => profile.userId === actorUserId);
      const signerProfile = profiles.find((profile) => profile.userId === signerUserId);

      if (!requesterProfile) {
        throw new Error("Please save your autograph profile first.");
      }

      if (!signerProfile) {
        throw new Error("The selected signer does not have an autograph profile yet.");
      }

      const created = await storage.createRequest({
        requesterUserId: actorUserId,
        requesterDisplayName: requesterProfile.displayName,
        requesterRole: requesterProfile.role,
        signerUserId,
        signerDisplayName: signerProfile.displayName,
        signerRole: signerProfile.role,
        message,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      const normalized = normalizeRequest(created);
      if (!normalized) {
        throw new Error("Unable to create autograph request.");
      }
      return normalized;
    },

    async signAutographRequest(
      actorUserId: string,
      requestId: string,
      input: SignAutographRequestInput,
    ): Promise<AutographRequest> {
      const signatureText = sanitizeSignature(input.signatureText);
      const visibility: AutographVisibility = isVisibility(input.visibility) ? input.visibility : "private";

      if (!signatureText) {
        throw new Error("Signature text is required.");
      }

      const allRequests = await storage.listRequests();
      const current = allRequests.find((entry) => entry.id === requestId);

      if (!current) {
        throw new Error("Request not found.");
      }

      if (current.signerUserId !== actorUserId) {
        throw new Error("Only the requested signer can sign this autograph.");
      }

      if (current.status !== "pending") {
        throw new Error("This autograph request has already been signed.");
      }

      const updated = await storage.updateRequest(requestId, {
        status: "signed",
        signatureText,
        visibility,
        signedAt: new Date().toISOString(),
      });

      const normalized = normalizeRequest(updated);
      if (!normalized) {
        throw new Error("Unable to sign autograph request.");
      }

      return normalized;
    },
  };
}
