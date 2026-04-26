import type { AutographStorage, ProfileEntry, RequestEntry } from "../service";

type JsonRequestOptions = {
  method?: string;
  body?: unknown;
};

async function requestJson<T>(baseUrl: string, pathname: string, options: JsonRequestOptions = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function createRestAutographStorage(baseUrl: string): AutographStorage {
  return {
    listProfiles() {
      return requestJson<ProfileEntry[]>(baseUrl, "/api/autographs/profiles");
    },

    saveProfile(profile) {
      return requestJson<ProfileEntry>(baseUrl, "/api/autographs/profiles", {
        method: "PUT",
        body: profile,
      });
    },

    async deleteProfile(profileId) {
      await requestJson(baseUrl, `/api/autographs/profiles/${encodeURIComponent(profileId)}`, {
        method: "DELETE",
      });
    },

    listRequests() {
      return requestJson<RequestEntry[]>(baseUrl, "/api/autographs/requests");
    },

    createRequest(request) {
      return requestJson<RequestEntry>(baseUrl, "/api/autographs/requests", {
        method: "POST",
        body: request,
      });
    },

    updateRequest(requestId, patch) {
      return requestJson<RequestEntry>(baseUrl, `/api/autographs/requests/${encodeURIComponent(requestId)}/sign`, {
        method: "POST",
        body: patch,
      });
    },
  };
}
