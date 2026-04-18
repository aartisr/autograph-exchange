import { createClient } from "@supabase/supabase-js";
import type { AutographStorage, AutographStorageContext, ProfileEntry, RequestEntry } from "@aartisr/autograph-core";
import type { AutographSupabasePersistenceConfig } from "./persistence-config";

type SupabaseProfileRow = {
  id: string;
  user_id: string;
  display_name: string;
  role: ProfileEntry["role"];
  updated_at: string;
};

type SupabaseRequestRow = {
  id: string;
  requester_user_id: string;
  requester_display_name: string;
  requester_role: RequestEntry["requesterRole"];
  signer_user_id: string;
  signer_display_name: string;
  signer_role: RequestEntry["signerRole"];
  message: string;
  status: RequestEntry["status"];
  signature_text: string | null;
  visibility: RequestEntry["visibility"] | null;
  created_at: string;
  signed_at: string | null;
};

type WritableProfile = {
  id?: string;
  userId: string;
  displayName: string;
  role: ProfileEntry["role"];
  updatedAt: string;
};

type WritableRequest = {
  requesterUserId: string;
  requesterDisplayName: string;
  requesterRole: RequestEntry["requesterRole"];
  signerUserId: string;
  signerDisplayName: string;
  signerRole: RequestEntry["signerRole"];
  message: string;
  status: RequestEntry["status"];
  signatureText?: string;
  visibility?: RequestEntry["visibility"];
  createdAt: string;
  signedAt?: string;
};

type WritableRequestPatch = Partial<WritableRequest>;

function normalizeWritableProfile(
  profile: Omit<ProfileEntry, "id"> & Partial<Pick<ProfileEntry, "id">>,
): WritableProfile {
  return {
    ...(profile.id ? { id: profile.id } : {}),
    userId: profile.userId,
    displayName: profile.displayName,
    role: profile.role,
    updatedAt: profile.updatedAt,
  };
}

function normalizeWritableRequest(request: Omit<RequestEntry, "id">): WritableRequest {
  return {
    requesterUserId: request.requesterUserId,
    requesterDisplayName: request.requesterDisplayName,
    requesterRole: request.requesterRole,
    signerUserId: request.signerUserId,
    signerDisplayName: request.signerDisplayName,
    signerRole: request.signerRole,
    message: request.message,
    status: request.status,
    signatureText: request.signatureText,
    visibility: request.visibility,
    createdAt: request.createdAt,
    signedAt: request.signedAt,
  };
}

function normalizeWritableRequestPatch(
  patch: Partial<Omit<RequestEntry, "id">>,
): WritableRequestPatch {
  return {
    requesterUserId: patch.requesterUserId,
    requesterDisplayName: patch.requesterDisplayName,
    requesterRole: patch.requesterRole,
    signerUserId: patch.signerUserId,
    signerDisplayName: patch.signerDisplayName,
    signerRole: patch.signerRole,
    message: patch.message,
    status: patch.status,
    signatureText: patch.signatureText,
    visibility: patch.visibility,
    createdAt: patch.createdAt,
    signedAt: patch.signedAt,
  };
}

function mapProfileRow(row: SupabaseProfileRow): ProfileEntry {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    role: row.role,
    updatedAt: row.updated_at,
  };
}

function mapRequestRow(row: SupabaseRequestRow): RequestEntry {
  return {
    id: row.id,
    requesterUserId: row.requester_user_id,
    requesterDisplayName: row.requester_display_name,
    requesterRole: row.requester_role,
    signerUserId: row.signer_user_id,
    signerDisplayName: row.signer_display_name,
    signerRole: row.signer_role,
    message: row.message,
    status: row.status,
    signatureText: row.signature_text ?? undefined,
    visibility: row.visibility ?? undefined,
    createdAt: row.created_at,
    signedAt: row.signed_at ?? undefined,
  };
}

function toProfileRow(profile: WritableProfile): Partial<SupabaseProfileRow> {
  return {
    ...(profile.id ? { id: profile.id } : {}),
    user_id: profile.userId,
    display_name: profile.displayName,
    role: profile.role,
    updated_at: profile.updatedAt,
  };
}

function toRequestRow(request: WritableRequest): Omit<SupabaseRequestRow, "id"> {
  return {
    requester_user_id: request.requesterUserId,
    requester_display_name: request.requesterDisplayName,
    requester_role: request.requesterRole,
    signer_user_id: request.signerUserId,
    signer_display_name: request.signerDisplayName,
    signer_role: request.signerRole,
    message: request.message,
    status: request.status,
    signature_text: request.signatureText ?? null,
    visibility: request.visibility ?? null,
    created_at: request.createdAt,
    signed_at: request.signedAt ?? null,
  };
}

function toRequestPatchRow(patch: WritableRequestPatch): Partial<Omit<SupabaseRequestRow, "id">> {
  return {
    ...(patch.requesterUserId ? { requester_user_id: patch.requesterUserId } : {}),
    ...(patch.requesterDisplayName ? { requester_display_name: patch.requesterDisplayName } : {}),
    ...(patch.requesterRole ? { requester_role: patch.requesterRole } : {}),
    ...(patch.signerUserId ? { signer_user_id: patch.signerUserId } : {}),
    ...(patch.signerDisplayName ? { signer_display_name: patch.signerDisplayName } : {}),
    ...(patch.signerRole ? { signer_role: patch.signerRole } : {}),
    ...(patch.message ? { message: patch.message } : {}),
    ...(patch.status ? { status: patch.status } : {}),
    ...(patch.signatureText !== undefined ? { signature_text: patch.signatureText ?? null } : {}),
    ...(patch.visibility !== undefined ? { visibility: patch.visibility ?? null } : {}),
    ...(patch.createdAt ? { created_at: patch.createdAt } : {}),
    ...(patch.signedAt !== undefined ? { signed_at: patch.signedAt ?? null } : {}),
  };
}

function selectColumns(columns: string[]) {
  return columns.join(", ");
}

function mapProfileRows(rows: unknown): ProfileEntry[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => mapProfileRow(row as unknown as SupabaseProfileRow));
}

function mapRequestRows(rows: unknown): RequestEntry[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => mapRequestRow(row as unknown as SupabaseRequestRow));
}

function mapSingleProfileRow(row: unknown): ProfileEntry {
  return mapProfileRow(row as unknown as SupabaseProfileRow);
}

function mapSingleRequestRow(row: unknown): RequestEntry {
  return mapRequestRow(row as unknown as SupabaseRequestRow);
}

export function createSupabaseAutographStorage(config: AutographSupabasePersistenceConfig): AutographStorage {
  const client = createClient(config.url, config.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const db = config.schema === "public" ? client : client.schema(config.schema);
  const profileColumns = selectColumns(["id", "user_id", "display_name", "role", "updated_at"]);
  const requestColumns = selectColumns([
    "id",
    "requester_user_id",
    "requester_display_name",
    "requester_role",
    "signer_user_id",
    "signer_display_name",
    "signer_role",
    "message",
    "status",
    "signature_text",
    "visibility",
    "created_at",
    "signed_at",
  ]);

  return {
    async listProfiles(context?: AutographStorageContext): Promise<ProfileEntry[]> {
      let query = db.from(config.profilesTable).select(profileColumns).order("updated_at", { ascending: false });

      if (context?.userId) {
        query = query.eq("user_id", context.userId);
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(`Unable to load autograph profiles: ${error.message}`);
      }

      return mapProfileRows(data);
    },

    async saveProfile(profile, _context?: AutographStorageContext): Promise<ProfileEntry> {
      if (profile.id) {
        const { data, error } = await db
          .from(config.profilesTable)
          .update(toProfileRow(normalizeWritableProfile(profile)))
          .eq("id", profile.id)
          .select(profileColumns)
          .single();

        if (error) {
          throw new Error(`Unable to update autograph profile: ${error.message}`);
        }

        return mapSingleProfileRow(data);
      }

      const { data, error } = await db
        .from(config.profilesTable)
        .insert(toProfileRow(normalizeWritableProfile(profile)))
        .select(profileColumns)
        .single();

      if (error) {
        throw new Error(`Unable to create autograph profile: ${error.message}`);
      }

      return mapSingleProfileRow(data);
    },

    async listRequests(_context?: AutographStorageContext): Promise<RequestEntry[]> {
      const { data, error } = await db.from(config.requestsTable).select(requestColumns).order("created_at", {
        ascending: false,
      });

      if (error) {
        throw new Error(`Unable to load autograph requests: ${error.message}`);
      }

      return mapRequestRows(data);
    },

    async createRequest(request, _context?: AutographStorageContext): Promise<RequestEntry> {
      const { data, error } = await db
        .from(config.requestsTable)
        .insert(toRequestRow(normalizeWritableRequest(request)))
        .select(requestColumns)
        .single();

      if (error) {
        throw new Error(`Unable to create autograph request: ${error.message}`);
      }

      return mapSingleRequestRow(data);
    },

    async updateRequest(
      requestId: string,
      patch: Partial<Omit<RequestEntry, "id">>,
      _context?: AutographStorageContext,
    ): Promise<RequestEntry> {
      const { data, error } = await db
        .from(config.requestsTable)
        .update(toRequestPatchRow(normalizeWritableRequestPatch(patch)))
        .eq("id", requestId)
        .select(requestColumns)
        .single();

      if (error) {
        throw new Error(`Unable to update autograph request: ${error.message}`);
      }

      return mapSingleRequestRow(data);
    },
  };
}
