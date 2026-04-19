"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AUTOGRAPH_API } from "../autograph-contract";
import type {
  AutographApiConfig,
  AutographFeatureEventHandler,
  AutographProfile,
  AutographRequest,
  UseAutographExchangeResult,
  SaveProfileInput,
  CreateRequestInput,
  SignRequestInput,
} from "./types";

type AutographRequestPageResponse = {
  items: AutographRequest[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
};

type AutographRequestListResponse = AutographRequest[] | AutographRequestPageResponse;

async function defaultFetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "same-origin",
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const data = (await response.json()) as { error?: string };
      if (typeof data?.error === "string" && data.error.trim()) {
        message = data.error;
      }
    } catch {
      // Ignore JSON parsing failures and fall back to the status message.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

function dedupeProfilesByUserId(profiles: AutographProfile[]): AutographProfile[] {
  const byUserId = new Map<string, AutographProfile>();

  for (const profile of profiles) {
    const existing = byUserId.get(profile.userId);
    if (!existing || profile.updatedAt >= existing.updatedAt) {
      byUserId.set(profile.userId, profile);
    }
  }

  return [...byUserId.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function dedupeSignerChoices(profiles: AutographProfile[]): AutographProfile[] {
  const byVisibleIdentity = new Map<string, AutographProfile>();

  for (const profile of profiles) {
    const key = `${profile.displayName.trim().toLowerCase()}::${profile.role}`;
    const existing = byVisibleIdentity.get(key);

    if (!existing || profile.updatedAt >= existing.updatedAt) {
      byVisibleIdentity.set(key, profile);
    }
  }

  return [...byVisibleIdentity.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function normalizeRequestPage(response: AutographRequestListResponse): AutographRequestPageResponse {
  if (Array.isArray(response)) {
    return {
      items: response,
      nextCursor: null,
      hasMore: false,
      total: response.length,
    };
  }

  return {
    items: Array.isArray(response.items) ? response.items : [],
    nextCursor: typeof response.nextCursor === "string" ? response.nextCursor : null,
    hasMore: Boolean(response.hasMore),
    total: Number.isFinite(response.total) ? response.total : 0,
  };
}

function buildRequestsUrl(baseUrl: string, params: Record<string, string | null | undefined>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.trim()) {
      search.set(key, value);
    }
  }

  const query = search.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
}

export function useAutographExchange(
  currentUserId?: string,
  config?: AutographApiConfig,
  onEvent?: AutographFeatureEventHandler,
): UseAutographExchangeResult {
  const [profiles, setProfiles] = useState<AutographProfile[]>([]);
  const [requests, setRequests] = useState<AutographRequest[]>([]);
  const [archive, setArchive] = useState<AutographRequest[]>([]);
  const [archiveNextCursor, setArchiveNextCursor] = useState<string | null>(null);
  const [hasMoreArchive, setHasMoreArchive] = useState(false);
  const [archiveLoadingMore, setArchiveLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const endpoints = config?.endpoints ?? AUTOGRAPH_API;
  const fetchJson = config?.fetcher ?? defaultFetchJson;

  const emitEvent = useCallback(
    (
      name: Parameters<AutographFeatureEventHandler>[0]["name"],
      detail?: Omit<Parameters<AutographFeatureEventHandler>[0], "name" | "timestamp" | "userId">,
    ) => {
      onEvent?.({
        name,
        timestamp: new Date().toISOString(),
        userId: currentUserId,
        ...detail,
      });
    },
    [currentUserId, onEvent],
  );

  const load = useCallback(async () => {
    if (!currentUserId) {
      setProfiles([]);
      setRequests([]);
      setArchive([]);
      setArchiveNextCursor(null);
      setHasMoreArchive(false);
      setArchiveLoadingMore(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [profileData, pendingResponse, signedResponse] = await Promise.all([
        fetchJson<AutographProfile[]>(endpoints.profiles),
        fetchJson<AutographRequestListResponse>(
          buildRequestsUrl(endpoints.requests, {
            status: "pending",
            limit: "100",
          }),
        ),
        fetchJson<AutographRequestListResponse>(
          buildRequestsUrl(endpoints.requests, {
            status: "signed",
            limit: "24",
          }),
        ),
      ]);

      const pendingPage = normalizeRequestPage(pendingResponse);
      const signedPage = normalizeRequestPage(signedResponse);

      setProfiles(Array.isArray(profileData) ? dedupeProfilesByUserId(profileData) : []);
      setRequests(pendingPage.items);
      setArchive(signedPage.items);
      setArchiveNextCursor(signedPage.nextCursor);
      setHasMoreArchive(signedPage.hasMore);
      emitEvent("load_succeeded", {
        metadata: {
          profileCount: Array.isArray(profileData) ? profileData.length : 0,
          requestCount: pendingPage.items.length + signedPage.items.length,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load autograph exchange.";
      setError(message);
      emitEvent("load_failed", { message });
    } finally {
      setLoading(false);
    }
  }, [currentUserId, emitEvent, endpoints, fetchJson]);

  useEffect(() => {
    void load();
  }, [load]);

  const myProfile = useMemo(
    () => profiles.find((profile) => profile.userId === currentUserId) ?? null,
    [profiles, currentUserId],
  );

  const availableSigners = useMemo(
    () => dedupeSignerChoices(profiles.filter((profile) => profile.userId !== currentUserId)),
    [profiles, currentUserId],
  );

  const inbox = useMemo(
    () => requests.filter((item) => item.signerUserId === currentUserId && item.status === "pending"),
    [requests, currentUserId],
  );

  const outbox = useMemo(
    () => requests.filter((item) => item.requesterUserId === currentUserId && item.status === "pending"),
    [requests, currentUserId],
  );

  const loadMoreArchive = useCallback(async () => {
    if (!currentUserId || archiveLoadingMore || !archiveNextCursor) {
      return;
    }

    setArchiveLoadingMore(true);
    setError(null);

    try {
      const response = await fetchJson<AutographRequestListResponse>(
        buildRequestsUrl(endpoints.requests, {
          status: "signed",
          limit: "24",
          cursor: archiveNextCursor,
        }),
      );
      const page = normalizeRequestPage(response);
      setArchive((prev) => [...prev, ...page.items]);
      setArchiveNextCursor(page.nextCursor);
      setHasMoreArchive(page.hasMore);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load more archive items.";
      setError(message);
      emitEvent("load_failed", { message, metadata: { phase: "loadMoreArchive" } });
    } finally {
      setArchiveLoadingMore(false);
    }
  }, [archiveLoadingMore, archiveNextCursor, currentUserId, emitEvent, endpoints.requests, fetchJson]);

  const saveProfile = useCallback(
    async (input: SaveProfileInput) => {
      setBusyAction("profile");
      setError(null);

      try {
        const profile = await fetchJson<AutographProfile>(endpoints.profiles, {
          method: "PUT",
          body: JSON.stringify(input),
        });

        setProfiles((prev) => dedupeProfilesByUserId([...prev.filter((item) => item.userId !== profile.userId), profile]));
        emitEvent("profile_saved", {
          metadata: {
            role: profile.role,
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to save profile.";
        setError(message);
        emitEvent("load_failed", { message, metadata: { phase: "saveProfile" } });
        throw err;
      } finally {
        setBusyAction(null);
      }
    },
    [emitEvent, endpoints.profiles, fetchJson],
  );

  const requestAutograph = useCallback(
    async (input: CreateRequestInput) => {
      setBusyAction("request");
      setError(null);

      try {
        const signerUserId = input.signerUserId.trim();
        const message = input.message.trim();

        if (!myProfile) {
          throw new Error("Please save your autograph profile first.");
        }

        if (!signerUserId) {
          throw new Error("Signer is required.");
        }

        if (!message) {
          throw new Error("Message is required.");
        }

        if (!profiles.some((profile) => profile.userId === signerUserId)) {
          throw new Error("The selected signer does not have an autograph profile yet.");
        }

        const created = await fetchJson<AutographRequest>(endpoints.requests, {
          method: "POST",
          body: JSON.stringify({
            signerUserId,
            message,
          }),
        });
        setRequests((prev) => [created, ...prev]);
        emitEvent("request_created", {
          requestId: created.id,
          metadata: {
            signerUserId: created.signerUserId,
          },
        });
        return created;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to create autograph request.";
        setError(message);
        emitEvent("load_failed", { message, metadata: { phase: "requestAutograph" } });
        throw err;
      } finally {
        setBusyAction(null);
      }
    },
    [emitEvent, endpoints.requests, fetchJson, myProfile, profiles],
  );

  const signAutograph = useCallback(
    async (input: SignRequestInput) => {
      setBusyAction(`sign:${input.requestId}`);
      setError(null);

      try {
        const updated = await fetchJson<AutographRequest>(endpoints.signRequest(input.requestId), {
          method: "POST",
          body: JSON.stringify({
            signatureText: input.signatureText,
            visibility: input.visibility,
          }),
        });

        setRequests((prev) => prev.filter((item) => item.id !== updated.id));
        setArchive((prev) => [updated, ...prev]);
        emitEvent("request_signed", {
          requestId: updated.id,
          metadata: {
            visibility: updated.visibility ?? "private",
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to sign autograph request.";
        setError(message);
        emitEvent("load_failed", { message, metadata: { phase: "signAutograph", requestId: input.requestId } });
        throw err;
      } finally {
        setBusyAction(null);
      }
    },
    [emitEvent, endpoints, fetchJson],
  );

  return {
    profiles,
    requests,
    myProfile,
    availableSigners,
    inbox,
    outbox,
    archive,
    hasMoreArchive,
    archiveLoadingMore,
    loading,
    error,
    busyAction,
    reload: load,
    saveProfile,
    requestAutograph,
    signAutograph,
    loadMoreArchive,
  };
}
