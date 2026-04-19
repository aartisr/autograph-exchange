"use client";

import React, { useEffect, useMemo, useState } from "react";
import { mergeAutographCopy } from "./copy";
import { ArchiveLane, HeroSection, InboxLane, MomentumSection, OutboxSection, ProfileSection, RequestComposerSection } from "./screen-sections";
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
    hasMoreArchive,
    archiveLoadingMore,
    onLoadMoreArchive,
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
  const focusSection = useMemo(() => {
    if (!hasProfile) return "profile";
    if (inbox.length > 0) return "inbox";
    if (availableSigners.length > 0) return "composer";
    if (outbox.length > 0) return "outbox";
    if (filteredArchive.length > 0) return "archive";
    return "composer";
  }, [availableSigners.length, filteredArchive.length, hasProfile, inbox.length, outbox.length]);

  useEffect(() => {
    setIsEditingProfile(!hasProfile);
  }, [hasProfile]);

  const nextStepCta = useMemo(() => {
    if (focusSection === "profile") {
      return { href: "#autograph-profile-setup", label: copy.nextStepCtaProfile };
    }

    if (focusSection === "composer") {
      return { href: "#autograph-request-composer", label: copy.nextStepCtaComposer };
    }

    if (focusSection === "inbox") {
      return { href: "#autograph-requests-for-you", label: copy.nextStepCtaInbox };
    }

    if (focusSection === "outbox") {
      return { href: "#autograph-requests-sent", label: copy.nextStepCtaOutbox };
    }

    return { href: "#autograph-signed-autographs", label: copy.nextStepCtaArchive };
  }, [copy, focusSection]);

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
        nextStepHref={nextStepCta.href}
        nextStepLabel={nextStepCta.label}
        outboxCount={outbox.length}
        inboxCount={inbox.length}
        archiveCount={filteredArchive.length}
      />

      <MomentumSection
        copy={copy}
        hasProfile={hasProfile}
        outboxCount={outbox.length}
        archiveCount={filteredArchive.length}
        lastSignedRequestId={lastSignedRequestId}
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
        isFocused={focusSection === "profile"}
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
        isFocused={focusSection === "composer"}
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
          isFocused={focusSection === "inbox"}
        />

        <ArchiveLane
          copy={copy}
          filteredArchive={filteredArchive}
          hasMoreArchive={hasMoreArchive}
          archiveLoadingMore={archiveLoadingMore}
          onLoadMoreArchive={onLoadMoreArchive}
          archiveFilter={archiveFilter}
          setArchiveFilter={setArchiveFilter}
          archiveSort={archiveSort}
          setArchiveSort={setArchiveSort}
          lastSignedRequestId={lastSignedRequestId}
          isFocused={focusSection === "archive"}
        />
      </div>

      <OutboxSection copy={copy} outbox={outbox} isFocused={focusSection === "outbox"} />
    </div>
  );
}
