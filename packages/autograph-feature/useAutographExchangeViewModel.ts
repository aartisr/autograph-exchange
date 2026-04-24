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

export function useAutographExchangeViewModel({
  roleLabels,
  userId,
  sessionName,
  sessionEmail,
  profileDisplayName,
  profileRole,
  archive,
  hasMoreArchive,
  archiveLoadingMore,
  onLoadMoreArchive,
  saveProfile,
  requestAutograph,
  signAutograph,
}: UseAutographExchangeViewModelArgs) {
  const [profileForm, setProfileForm] = useState<ProfileFormState>({ displayName: "", role: "student" });
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

  const signaturePreset = useMemo(
    () => buildSignaturePreset(userId ?? "anonymous", effectiveProfileName),
    [userId, effectiveProfileName],
  );

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = (profileForm.displayName || effectiveProfileName).trim();
    const role = profileForm.role || effectiveProfileRole;

    try {
      await saveProfile({ displayName, role });
      setProfileForm({ displayName: "", role });
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
