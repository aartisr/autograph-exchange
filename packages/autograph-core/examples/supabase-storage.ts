import type { AutographStorage, ProfileEntry, RequestEntry } from "../service";

type SupabaseMutationResult<T> = Promise<{ data: T | null; error: { message: string } | null }>;

interface SupabaseSelectBuilder<T> {
  eq(column: string, value: string): SupabaseSelectBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): SupabaseSelectBuilder<T>;
  then<TResult1 = { data: T[] | null; error: { message: string } | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: T[] | null; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
}

interface SupabaseTable<T> {
  select(columns?: string): SupabaseSelectBuilder<T>;
  insert(values: Omit<T, "id">): { select(): { single(): SupabaseMutationResult<T> } };
  update(values: Partial<Omit<T, "id">>): {
    eq(column: string, value: string): { select(): { single(): SupabaseMutationResult<T> } };
  };
}

interface SupabaseLikeClient {
  from<T>(table: string): SupabaseTable<T>;
}

function assertNoError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

export function createSupabaseAutographStorage(client: SupabaseLikeClient): AutographStorage {
  return {
    async listProfiles(context) {
      const query = client.from<ProfileEntry>("autograph_profiles").select().order("displayName");
      const result = await query;
      assertNoError(result.error);
      const profiles = result.data ?? [];
      return context?.userId ? profiles.filter((profile) => profile.userId === context.userId) : profiles;
    },

    async saveProfile(profile) {
      if (profile.id) {
        const result = await client
          .from<ProfileEntry>("autograph_profiles")
          .update(profile)
          .eq("id", profile.id)
          .select()
          .single();
        assertNoError(result.error);
        if (!result.data) {
          throw new Error("Unable to save autograph profile.");
        }
        return result.data;
      }

      const result = await client.from<ProfileEntry>("autograph_profiles").insert(profile).select().single();
      assertNoError(result.error);
      if (!result.data) {
        throw new Error("Unable to create autograph profile.");
      }
      return result.data;
    },

    async listRequests() {
      const result = await client.from<RequestEntry>("autograph_requests").select();
      assertNoError(result.error);
      return result.data ?? [];
    },

    async createRequest(request) {
      const result = await client.from<RequestEntry>("autograph_requests").insert(request).select().single();
      assertNoError(result.error);
      if (!result.data) {
        throw new Error("Unable to create autograph request.");
      }
      return result.data;
    },

    async updateRequest(requestId, patch) {
      const result = await client
        .from<RequestEntry>("autograph_requests")
        .update(patch)
        .eq("id", requestId)
        .select()
        .single();
      assertNoError(result.error);
      if (!result.data) {
        throw new Error("Unable to update autograph request.");
      }
      return result.data;
    },
  };
}
