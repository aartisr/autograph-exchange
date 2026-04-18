"use client";

import React, { useEffect, useMemo, useState } from "react";
import { mergeAutographCopy } from "./copy";
import { ArchiveLane, HeroSection, InboxLane, OutboxSection, ProfileSection, RequestComposerSection } from "./screen-sections";
import type { AutographExchangeScreenProps } from "./types";

export function AutographExchangeScreen(props: AutographExchangeScreenProps) {
  const {
    error,
    statusMessage,
    nextAction,
    hasProfile,
    myProfile,
    availableSigners,
    inbox,
    outbox,
    filteredArchive,
    loading,
    busyAction,
    roleOptions,
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
    sessionIdentity,
    onProfileSubmit,
    onRequestSubmit,
    onSignRequest,
    renderSignaturePreview,
    copy: copyOverrides,
  } = props;

  const copy = useMemo(() => mergeAutographCopy(copyOverrides), [copyOverrides]);
  const [isEditingProfile, setIsEditingProfile] = useState(!hasProfile);

  useEffect(() => {
    if (!hasProfile) {
      setIsEditingProfile(true);
    }
  }, [hasProfile]);

  return (
    <div className="autograph-screen autograph-shell">
      <div className="autograph-live-region" aria-live="polite" aria-atomic="true">
        {statusMessage ? <p className="autograph-status-banner">{statusMessage}</p> : null}
      </div>
      {error ? (
        <p className="app-alert-error autograph-error-banner" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}

      <HeroSection
        copy={copy}
        nextAction={nextAction}
        outboxCount={outbox.length}
        inboxCount={inbox.length}
        archiveCount={filteredArchive.length}
      />

      <ProfileSection
        copy={copy}
        hasProfile={hasProfile}
        isEditingProfile={isEditingProfile}
        setIsEditingProfile={setIsEditingProfile}
        effectiveProfileName={effectiveProfileName}
        effectiveProfileRole={effectiveProfileRole}
        sessionIdentity={sessionIdentity}
        profileForm={profileForm}
        setProfileForm={setProfileForm}
        roleOptions={roleOptions}
        busyAction={busyAction}
        onProfileSubmit={onProfileSubmit}
      />

      <RequestComposerSection
        copy={copy}
        hasProfile={hasProfile}
        loading={loading}
        myProfile={myProfile}
        availableSigners={availableSigners}
        requestForm={requestForm}
        setRequestForm={setRequestForm}
        busyAction={busyAction}
        onRequestSubmit={onRequestSubmit}
      />

      <div className="autograph-lanes" data-testid="autograph-lanes">
        <InboxLane
          copy={copy}
          inbox={inbox}
          lastSignedRequestId={lastSignedRequestId}
          expandedRequestId={expandedRequestId}
          setExpandedRequestId={setExpandedRequestId}
          signaturePreset={signaturePreset}
          signatureDrafts={signatureDrafts}
          setSignatureDrafts={setSignatureDrafts}
          busyAction={busyAction}
          renderSignaturePreview={renderSignaturePreview}
          onSignRequest={onSignRequest}
        />

        <ArchiveLane
          copy={copy}
          filteredArchive={filteredArchive}
          archiveFilter={archiveFilter}
          setArchiveFilter={setArchiveFilter}
          archiveSort={archiveSort}
          setArchiveSort={setArchiveSort}
          lastSignedRequestId={lastSignedRequestId}
        />
      </div>

      <OutboxSection copy={copy} outbox={outbox} />
    </div>
  );
}
