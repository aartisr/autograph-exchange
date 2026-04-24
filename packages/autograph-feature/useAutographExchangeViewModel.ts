import type { FormEvent } from "react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { buildSignaturePreset } from "./signature-generator";
import type {
  ArchiveSort,
  AutographRequest,
  AutographRole,
  ProfileFormState,
  RequestFormState,
  RoleOption,
  UseAutographExchangeViewModelArgs,
} from "./types";

function defaultRoleLabel(role: AutographRole): string {
  return role === "teacher" ? "Teacher" : "Student";
}

function joinProfileTags(value: string[] | undefined): string {
  return (value ?? []).join(", ");
}

function splitProfileTags(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function createProfileFormState(input: {
  displayName?: string;
  role?: AutographRole;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  affiliation?: string;
  location?: string;
  subjects?: string[];
  interests?: string[];
  signaturePrompt?: string;
}): ProfileFormState {
  return {
    displayName: input.displayName ?? "",
    role: input.role ?? "student",
    headline: input.headline ?? "",
    bio: input.bio ?? "",
    avatarUrl: input.avatarUrl ?? "",
    affiliation: input.affiliation ?? "",
    location: input.location ?? "",
    subjects: joinProfileTags(input.subjects),
    interests: joinProfileTags(input.interests),
    signaturePrompt: input.signaturePrompt ?? "",
  };
}

export function useAutographExchangeViewModel({
  roleLabels,
  userId,
  sessionName,
  sessionEmail,
  profileDisplayName,
  profileRole,
  profileHeadline,
  profileBio,
  profileAvatarUrl,
  profileAffiliation,
  profileLocation,
  profileSubjects,
  profileInterests,
  profileSignaturePrompt,
  archive,
  hasMoreArchive,
  archiveLoadingMore,
  onLoadMoreArchive,
  saveProfile,
  requestAutograph,
  signAutograph,
}: UseAutographExchangeViewModelArgs) {
  const [profileForm, setProfileForm] = useState<ProfileFormState>(() =>
    createProfileFormState({
      displayName: profileDisplayName,
      role: profileRole,
      headline: profileHeadline,
      bio: profileBio,
      avatarUrl: profileAvatarUrl,
      affiliation: profileAffiliation,
      location: profileLocation,
      subjects: profileSubjects,
      interests: profileInterests,
      signaturePrompt: profileSignaturePrompt,
    }),
  );
  const [requestForm, setRequestForm] = useState<RequestFormState>({ signerUserId: "", message: "" });
  const [signatureDrafts, setSignatureDrafts] = useState<Record<string, string>>({});
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [archiveFilter, setArchiveFilter] = useState("");
  const [archiveSort, setArchiveSort] = useState<ArchiveSort>("newest");
  const [lastCreatedRequest, setLastCreatedRequest] = useState<AutographRequest | null>(null);
  const [lastSignedRequestId, setLastSignedRequestId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const deferredArchiveFilter = useDeferredValue(archiveFilter);

  const roleOptions = useMemo<RoleOption[]>(
    () => [
      { value: "student", label: roleLabels?.student ?? defaultRoleLabel("student") },
      { value: "teacher", label: roleLabels?.teacher ?? defaultRoleLabel("teacher") },
    ],
    [roleLabels],
  );

  const filteredArchive = useMemo(() => {
    const normalized = deferredArchiveFilter.trim().toLowerCase();
    const base = archive.filter((item) => {
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
  }, [archive, deferredArchiveFilter, archiveSort]);

  useEffect(() => {
    if (!lastSignedRequestId) return;
    const timer = window.setTimeout(() => setLastSignedRequestId(null), 2200);
    return () => window.clearTimeout(timer);
  }, [lastSignedRequestId]);

  const effectiveProfileName = profileDisplayName ?? sessionName ?? sessionEmail ?? "";
  const effectiveProfileRole = profileRole ?? "student";
  const sessionIdentity = sessionEmail ?? userId ?? "Current signed-in account";

  useEffect(() => {
    const hasSavedProfileDetails = Boolean(
      profileDisplayName
        || profileHeadline
        || profileBio
        || profileAvatarUrl
        || profileAffiliation
        || profileLocation
        || profileSubjects?.length
        || profileInterests?.length
        || profileSignaturePrompt,
    );

    if (!hasSavedProfileDetails) {
      setProfileForm((prev) => ({ ...prev, role: profileRole ?? prev.role }));
      return;
    }

    setProfileForm(
      createProfileFormState({
        displayName: profileDisplayName,
        role: profileRole,
        headline: profileHeadline,
        bio: profileBio,
        avatarUrl: profileAvatarUrl,
        affiliation: profileAffiliation,
        location: profileLocation,
        subjects: profileSubjects,
        interests: profileInterests,
        signaturePrompt: profileSignaturePrompt,
      }),
    );
  }, [
    profileAffiliation,
    profileAvatarUrl,
    profileBio,
    profileDisplayName,
    profileHeadline,
    profileInterests,
    profileLocation,
    profileRole,
    profileSignaturePrompt,
    profileSubjects,
  ]);

  const signaturePreset = useMemo(
    () => buildSignaturePreset(userId ?? "anonymous", effectiveProfileName),
    [userId, effectiveProfileName],
  );

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = (profileForm.displayName || effectiveProfileName).trim();
    const role = profileForm.role || effectiveProfileRole;

    try {
      await saveProfile({
        displayName,
        role,
        headline: profileForm.headline.trim(),
        bio: profileForm.bio.trim(),
        avatarUrl: profileForm.avatarUrl.trim(),
        affiliation: profileForm.affiliation.trim(),
        location: profileForm.location.trim(),
        subjects: splitProfileTags(profileForm.subjects),
        interests: splitProfileTags(profileForm.interests),
        signaturePrompt: profileForm.signaturePrompt.trim(),
      });
      setProfileForm((prev) => ({ ...prev, displayName, role }));
      setStatusMessage(`Profile saved for ${displayName}. It is linked to ${sessionIdentity}.`);
      return true;
    } catch {
      return false;
    }
  }

  async function handleRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const created = await requestAutograph(requestForm);
      setLastCreatedRequest(created);
      setStatusMessage("Autograph request sent.");
    } catch {
      return;
    }
  }

  async function handleSign(requestId: string) {
    try {
      await signAutograph({
        requestId,
        signatureText: signatureDrafts[requestId] ?? "",
      });
    } catch {
      return;
    }

    setStatusMessage("Autograph signed and added to the archive.");
    setSignatureDrafts((prev) => {
      const next = { ...prev };
      delete next[requestId];
      return next;
    });
    setExpandedRequestId(null);
    setLastSignedRequestId(requestId);
  }

  return {
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
    lastCreatedRequest,
    lastSignedRequestId,
    statusMessage,
    roleOptions,
    filteredArchive,
    hasMoreArchive,
    archiveLoadingMore,
    onLoadMoreArchive,
    signaturePreset,
    effectiveProfileName,
    effectiveProfileRole,
    sessionIdentity,
    handleProfileSubmit,
    handleRequestSubmit,
    handleSign,
  };
}
