"use client";

import { useMemo, useState } from "react";
import type {
  AutographExchangeScreenProps,
  AutographFeatureAuthStatus,
  AutographFeatureViewer,
  AutographProfile,
  AutographRequest,
  AutographRole,
  ArchiveSort,
  SignaturePreset,
} from "../../types";

type UseAutographFeatureAdapterArgs = {
  authStatus: AutographFeatureAuthStatus;
  viewer: AutographFeatureViewer | null;
  profiles: AutographProfile[];
  requests: AutographRequest[];
  loading: boolean;
  error?: string | null;
  busyAction?: string | null;
  saveProfile: (input: { displayName: string; role: AutographRole }) => Promise<void>;
  requestAutograph: (input: { signerUserId: string; message: string }) => Promise<void>;
  signAutograph: (input: { requestId: string; signatureText: string }) => Promise<void>;
  buildSignaturePreset: (userId: string, displayName: string) => SignaturePreset;
};

type UseAutographFeatureAdapterResult = {
  authStatus: AutographFeatureAuthStatus;
  viewer: AutographFeatureViewer | null;
  nextAction: string;
  screenProps: Omit<AutographExchangeScreenProps, "renderSignaturePreview">;
};

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

export function useAutographFeatureAdapter({
  authStatus,
  viewer,
  profiles,
  requests,
  loading,
  error = null,
  busyAction = null,
  saveProfile,
  requestAutograph,
  signAutograph,
  buildSignaturePreset,
}: UseAutographFeatureAdapterArgs): UseAutographFeatureAdapterResult {
  const [profileForm, setProfileForm] = useState<{ displayName: string; role: AutographRole }>({
    displayName: "",
    role: "student",
  });
  const [requestForm, setRequestForm] = useState<{ signerUserId: string; message: string }>({
    signerUserId: "",
    message: "",
  });
  const [signatureDrafts, setSignatureDrafts] = useState<Record<string, string>>({});
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [archiveFilter, setArchiveFilter] = useState("");
  const [archiveSort, setArchiveSort] = useState<ArchiveSort>("newest");
  const [lastSignedRequestId, setLastSignedRequestId] = useState<string | null>(null);

  const safeProfiles = useMemo(() => dedupeProfilesByUserId(profiles), [profiles]);
  const myProfile = useMemo(
    () => safeProfiles.find((profile) => profile.userId === viewer?.id) ?? null,
    [safeProfiles, viewer?.id],
  );
  const availableSigners = useMemo(
    () => dedupeSignerChoices(safeProfiles.filter((profile) => profile.userId !== viewer?.id)),
    [safeProfiles, viewer?.id],
  );
  const inbox = useMemo(
    () => requests.filter((item) => item.signerUserId === viewer?.id && item.status === "pending"),
    [requests, viewer?.id],
  );
  const outbox = useMemo(
    () => requests.filter((item) => item.requesterUserId === viewer?.id && item.status === "pending"),
    [requests, viewer?.id],
  );
  const archiveBase = useMemo(() => requests.filter((item) => item.status === "signed"), [requests]);

  const filteredArchive = useMemo(() => {
    const normalized = archiveFilter.trim().toLowerCase();
    const base = archiveBase.filter((item) => {
      if (!normalized) return true;
      return (
        item.requesterDisplayName.toLowerCase().includes(normalized)
        || item.signerDisplayName.toLowerCase().includes(normalized)
        || item.message.toLowerCase().includes(normalized)
        || (item.signatureText ?? "").toLowerCase().includes(normalized)
      );
    });

    return [...base].sort((a, b) => {
      const left = new Date(a.signedAt ?? a.createdAt).getTime();
      const right = new Date(b.signedAt ?? b.createdAt).getTime();
      return archiveSort === "newest" ? right - left : left - right;
    });
  }, [archiveBase, archiveFilter, archiveSort]);

  const effectiveProfileName = myProfile?.displayName ?? viewer?.name ?? viewer?.email ?? "";
  const effectiveProfileRole = myProfile?.role ?? "student";
  const signaturePreset = buildSignaturePreset(viewer?.id ?? "anonymous", effectiveProfileName);

  const nextAction = !myProfile
    ? "Start by saving your profile so people know who you are."
    : inbox.length > 0
      ? "You have autograph requests waiting. Open one and reply with your autograph."
      : availableSigners.length > 0
        ? "Pick one person and ask for an autograph with a short personal note."
        : "You are ready. Once others create profiles, you can start exchanging autographs.";

  return {
    authStatus,
    viewer,
    nextAction,
    screenProps: {
      error,
      nextAction,
      hasProfile: Boolean(myProfile),
      myProfile,
      availableSigners,
      inbox,
      outbox,
      filteredArchive,
      loading,
      busyAction,
      roleOptions: [
        { value: "student", label: "Student" },
        { value: "teacher", label: "Teacher" },
      ],
      profileForm,
      setProfileForm,
      requestForm,
      setRequestForm,
      signatureDrafts,
      setSignatureDrafts,
      expandedRequestId,
      setExpandedRequestId,
      archiveFilter,
      setArchiveFilter,
      archiveSort,
      setArchiveSort,
      lastSignedRequestId,
      signaturePreset,
      effectiveProfileName,
      effectiveProfileRole,
      onProfileSubmit: async (event) => {
        event.preventDefault();
        await saveProfile({
          displayName: (profileForm.displayName || effectiveProfileName).trim(),
          role: profileForm.role || effectiveProfileRole,
        });
        setProfileForm({ displayName: "", role: effectiveProfileRole });
        return true;
      },
      onRequestSubmit: async (event) => {
        event.preventDefault();
        await requestAutograph(requestForm);
        setRequestForm({ signerUserId: "", message: "" });
      },
      onSignRequest: async (requestId) => {
        await signAutograph({
          requestId,
          signatureText: signatureDrafts[requestId] ?? "",
        });
        setSignatureDrafts((prev) => {
          const next = { ...prev };
          delete next[requestId];
          return next;
        });
        setExpandedRequestId(null);
        setLastSignedRequestId(requestId);
      },
    },
  };
}
