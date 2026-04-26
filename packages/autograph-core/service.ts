import {
  AUTOGRAPH_PROFILES_MODULE,
  AUTOGRAPH_REQUESTS_MODULE,
  type AdminUpsertAutographProfileInput,
  type AutographProfile,
  type AutographRequest,
  type AutographRole,
  type AutographVisibility,
  type CreateAutographRequestInput,
  type PublicAutographProfile,
  type SignAutographRequestInput,
  type UpsertAutographProfileInput,
} from "@aartisr/autograph-contract";

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
  deleteProfile(profileId: string, context?: AutographStorageContext): Promise<void>;
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
  delete(module: string, id: string, context?: AutographStorageContext): Promise<void>;
}

export interface AutographService {
  listAutographProfiles(): Promise<AutographProfile[]>;
  listPublicAutographProfiles(): Promise<PublicAutographProfile[]>;
  getPublicAutographProfile(profileId: string): Promise<PublicAutographProfile | null>;
  upsertAutographProfile(
    actorUserId: string,
    input: UpsertAutographProfileInput,
  ): Promise<AutographProfile>;
  adminUpsertAutographProfile(
    input: AdminUpsertAutographProfileInput & { id?: string },
  ): Promise<AutographProfile>;
  updateAutographProfile(
    actorUserId: string,
    profileId: string,
    input: UpsertAutographProfileInput,
    options?: { canManageAllProfiles?: boolean },
  ): Promise<AutographProfile>;
  deleteAutographProfile(
    actorUserId: string,
    profileId: string,
    options?: { canManageAllProfiles?: boolean },
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
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  affiliation?: string;
  location?: string;
  subjects?: string[];
  interests?: string[];
  signaturePrompt?: string;
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

function sanitizeOptionalText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim().slice(0, maxLength);
  return trimmed || undefined;
}

function sanitizeOptionalUrl(value: unknown): string | undefined {
  const trimmed = sanitizeOptionalText(value, 300);
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

function sanitizeAvatarUrl(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(trimmed)) {
    return trimmed.length <= 380_000 ? trimmed : undefined;
  }

  return sanitizeOptionalUrl(trimmed);
}

function sanitizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const tags = value
    .map((item) => (typeof item === "string" ? item.trim().slice(0, 36) : ""))
    .filter(Boolean);

  return Array.from(new Set(tags)).slice(0, 8);
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
    headline: sanitizeOptionalText(entry.headline, 120),
    bio: sanitizeOptionalText(entry.bio, 500),
    avatarUrl: sanitizeAvatarUrl(entry.avatarUrl),
    affiliation: sanitizeOptionalText(entry.affiliation, 120),
    location: sanitizeOptionalText(entry.location, 120),
    subjects: sanitizeTags(entry.subjects),
    interests: sanitizeTags(entry.interests),
    signaturePrompt: sanitizeOptionalText(entry.signaturePrompt, 180),
    updatedAt: entry.updatedAt || new Date(0).toISOString(),
  };
}

function toPublicProfile(profile: AutographProfile): PublicAutographProfile {
  const { userId: _userId, ...publicProfile } = profile;
  return publicProfile;
}

function sanitizeProfileInput(input: UpsertAutographProfileInput) {
  return {
    displayName: sanitizeDisplayName(input.displayName),
    role: input.role,
    headline: sanitizeOptionalText(input.headline, 120),
    bio: sanitizeOptionalText(input.bio, 500),
    avatarUrl: sanitizeAvatarUrl(input.avatarUrl),
    affiliation: sanitizeOptionalText(input.affiliation, 120),
    location: sanitizeOptionalText(input.location, 120),
    subjects: sanitizeTags(input.subjects),
    interests: sanitizeTags(input.interests),
    signaturePrompt: sanitizeOptionalText(input.signaturePrompt, 180),
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

    deleteProfile(profileId, context) {
      return store.delete(AUTOGRAPH_PROFILES_MODULE, profileId, context);
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

async function findLatestProfileForUser(storage: AutographStorage, userId: string): Promise<AutographProfile | undefined> {
  const existingEntries = await storage.listProfiles({ userId });
  return existingEntries
    .map((entry) => normalizeProfile(entry))
    .filter((entry): entry is AutographProfile => Boolean(entry))
    .sort((a, b) => profileRecencyValue(b) - profileRecencyValue(a))[0];
}

async function findProfileById(storage: AutographStorage, profileId: string): Promise<AutographProfile | undefined> {
  return (await storage.listProfiles())
    .map((entry) => normalizeProfile(entry))
    .filter((entry): entry is AutographProfile => Boolean(entry))
    .find((entry) => entry.id === profileId);
}

async function saveProfileForUser(
  storage: AutographStorage,
  targetUserId: string,
  input: UpsertAutographProfileInput,
  profileId?: string,
): Promise<AutographProfile> {
  const sanitized = sanitizeProfileInput(input);

  if (!sanitized.displayName) {
    throw new Error("Display name is required.");
  }

  if (!isRole(sanitized.role)) {
    throw new Error("Role must be student or teacher.");
  }

  const existing = profileId
    ? (await storage.listProfiles()).map((entry) => normalizeProfile(entry)).find((entry) => entry?.id === profileId)
    : await findLatestProfileForUser(storage, targetUserId);

  if (profileId && (!existing || existing.userId !== targetUserId)) {
    throw new Error("Profile not found.");
  }

  const saved = await storage.saveProfile(
    {
      id: existing?.id,
      userId: targetUserId,
      displayName: sanitized.displayName,
      role: sanitized.role,
      headline: sanitized.headline,
      bio: sanitized.bio,
      avatarUrl: sanitized.avatarUrl,
      affiliation: sanitized.affiliation,
      location: sanitized.location,
      subjects: sanitized.subjects,
      interests: sanitized.interests,
      signaturePrompt: sanitized.signaturePrompt,
      updatedAt: new Date().toISOString(),
    },
    { userId: targetUserId },
  );

  const normalized = normalizeProfile(saved);
  if (!normalized) {
    throw new Error("Unable to save profile.");
  }
  return normalized;
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

    async listPublicAutographProfiles(): Promise<PublicAutographProfile[]> {
      const profiles = await this.listAutographProfiles();
      return profiles.map(toPublicProfile);
    },

    async getPublicAutographProfile(profileId: string): Promise<PublicAutographProfile | null> {
      const profile = (await this.listAutographProfiles()).find((item) => item.id === profileId);
      return profile ? toPublicProfile(profile) : null;
    },

    async upsertAutographProfile(
      actorUserId: string,
      input: UpsertAutographProfileInput,
    ): Promise<AutographProfile> {
      return saveProfileForUser(storage, actorUserId, input);
    },

    async adminUpsertAutographProfile(
      input: AdminUpsertAutographProfileInput & { id?: string },
    ): Promise<AutographProfile> {
      const targetUserId = input.userId.trim().toLowerCase();

      if (!targetUserId) {
        throw new Error("User ID is required.");
      }

      return saveProfileForUser(storage, targetUserId, input, input.id);
    },

    async updateAutographProfile(
      actorUserId: string,
      profileId: string,
      input: UpsertAutographProfileInput,
      options?: { canManageAllProfiles?: boolean },
    ): Promise<AutographProfile> {
      const current = (await this.listAutographProfiles()).find((profile) => profile.id === profileId);

      if (!current) {
        throw new Error("Profile not found.");
      }

      if (!options?.canManageAllProfiles && current.userId !== actorUserId) {
        throw new Error("Only the profile owner can edit this profile.");
      }

      return saveProfileForUser(storage, current.userId, input, profileId);
    },

    async deleteAutographProfile(
      actorUserId: string,
      profileId: string,
      options?: { canManageAllProfiles?: boolean },
    ): Promise<AutographProfile> {
      const current = await findProfileById(storage, profileId);

      if (!current) {
        throw new Error("Profile not found.");
      }

      if (!options?.canManageAllProfiles && current.userId !== actorUserId) {
        throw new Error("Only the profile owner can delete this profile.");
      }

      await storage.deleteProfile(profileId, { userId: current.userId });
      return current;
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
      const signerUserIdInput = input.signerUserId?.trim() ?? "";
      const signerProfileId = input.signerProfileId?.trim() ?? "";
      const message = sanitizeMessage(input.message);

      if (!signerUserIdInput && !signerProfileId) {
        throw new Error("Signer is required.");
      }

      if (!message) {
        throw new Error("Message is required.");
      }

      const profiles = await this.listAutographProfiles();
      const requesterProfile = profiles.find((profile) => profile.userId === actorUserId);
      const signerProfile = signerProfileId
        ? profiles.find((profile) => profile.id === signerProfileId)
        : profiles.find((profile) => profile.userId === signerUserIdInput);

      if (!requesterProfile) {
        throw new Error("Please save your autograph profile first.");
      }

      if (!signerProfile) {
        throw new Error("The selected signer does not have an autograph profile yet.");
      }

      if (signerProfile.userId === actorUserId) {
        throw new Error("You cannot request your own autograph.");
      }

      const created = await storage.createRequest({
        requesterUserId: actorUserId,
        requesterDisplayName: requesterProfile.displayName,
        requesterRole: requesterProfile.role,
        signerUserId: signerProfile.userId,
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
