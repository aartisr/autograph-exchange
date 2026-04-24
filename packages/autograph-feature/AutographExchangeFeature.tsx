"use client";

import React, { useEffect, useRef } from "react";
import { AutographExchangeScreen } from "./AutographExchangeScreen";
import { mergeAutographCopy } from "./copy";
import { SignaturePreview } from "./SignaturePreview";
import { useAutographExchange } from "./useAutographExchange";
import { useAutographExchangeViewModel } from "./useAutographExchangeViewModel";
import type { AutographExchangeFeatureProps } from "./types";

function DefaultLoadingState({ message }: { message: string }) {
  return (
    <section className="autograph-feature-state" role="status" aria-live="polite" aria-busy="true">
      <div className="autograph-feature-card">
        <p className="autograph-feature-copy">{message}</p>
      </div>
    </section>
  );
}

function DefaultSignedOutState({
  copy,
  message,
  href,
  label,
}: {
  copy: ReturnType<typeof mergeAutographCopy>;
  message: string;
  href: string;
  label: string;
}) {
  return (
    <section className="autograph-feature-state">
      <div className="autograph-feature-card autograph-feature-card-signed-out">
        <div className="autograph-feature-intro">
          <p className="autograph-feature-eyebrow">{copy.signedOutKicker}</p>
          <h2 className="autograph-feature-title">{copy.signedOutTitle}</h2>
          <p className="autograph-feature-copy">{message}</p>
        </div>
        <div className="autograph-feature-benefits" aria-label={copy.signedOutBenefitsLabel}>
          <article className="autograph-feature-benefit">
            <p className="autograph-feature-benefit-title">{copy.signedOutBenefitOneTitle}</p>
            <p className="autograph-feature-benefit-copy">{copy.signedOutBenefitOneCopy}</p>
          </article>
          <article className="autograph-feature-benefit">
            <p className="autograph-feature-benefit-title">{copy.signedOutBenefitTwoTitle}</p>
            <p className="autograph-feature-benefit-copy">{copy.signedOutBenefitTwoCopy}</p>
          </article>
          <article className="autograph-feature-benefit">
            <p className="autograph-feature-benefit-title">{copy.signedOutBenefitThreeTitle}</p>
            <p className="autograph-feature-benefit-copy">{copy.signedOutBenefitThreeCopy}</p>
          </article>
        </div>
        <a href={href} className="autograph-feature-cta">
          {label}
        </a>
      </div>
    </section>
  );
}

function buildNextAction(
  copy: ReturnType<typeof mergeAutographCopy>,
  hasProfile: boolean,
  inboxCount: number,
  signerCount: number,
) {
  if (!hasProfile) {
    return copy.nextActionProfile;
  }

  if (inboxCount > 0) {
    return copy.nextActionInbox;
  }

  if (signerCount > 0) {
    return copy.nextActionComposer;
  }

  return copy.nextActionWaitingForProfiles;
}

export function AutographExchangeFeature({
  authStatus,
  viewer,
  api,
  copy,
  roleLabels,
  loadingMessage = "Loading autograph exchange...",
  signedOutMessage = "Sign in to start asking for and giving autographs.",
  signInHref = "/sign-in",
  signInLabel = "Sign in",
  renderShell,
  renderSignaturePreview,
  onEvent,
}: AutographExchangeFeatureProps) {
  const userId = viewer?.id;
  const lastViewEventKey = useRef<string | null>(null);
  const resolvedCopy = React.useMemo(() => mergeAutographCopy(copy), [copy]);
  const {
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
    saveProfile,
    requestAutograph,
    signAutograph,
    loadMoreArchive,
  } = useAutographExchange(userId, api, onEvent);

  const viewModel = useAutographExchangeViewModel({
    roleLabels,
    userId,
    sessionName: viewer?.name,
    sessionEmail: viewer?.email,
    profileDisplayName: myProfile?.displayName,
    profileRole: myProfile?.role,
    profileHeadline: myProfile?.headline,
    profileBio: myProfile?.bio,
    profileAvatarUrl: myProfile?.avatarUrl,
    profileAffiliation: myProfile?.affiliation,
    profileLocation: myProfile?.location,
    profileSubjects: myProfile?.subjects,
    profileInterests: myProfile?.interests,
    profileSignaturePrompt: myProfile?.signaturePrompt,
    archive,
    hasMoreArchive,
    archiveLoadingMore,
    onLoadMoreArchive: loadMoreArchive,
    saveProfile,
    requestAutograph,
    signAutograph,
  });

  useEffect(() => {
    const hasProfile = Boolean(myProfile);
    const currentKey =
      authStatus === "loading"
        ? "loading"
        : !viewer || authStatus === "unauthenticated"
          ? "signed-out"
          : `authenticated:${viewer.id}:${hasProfile ? "profile" : "no-profile"}`;

    if (lastViewEventKey.current === currentKey) {
      return;
    }

    lastViewEventKey.current = currentKey;

    if (authStatus === "loading") {
      onEvent?.({
        name: "view_loading",
        timestamp: new Date().toISOString(),
        userId,
      });
      return;
    }

    if (!viewer || authStatus === "unauthenticated") {
      onEvent?.({
        name: "view_signed_out",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    onEvent?.({
      name: "view_authenticated",
      timestamp: new Date().toISOString(),
      userId: viewer.id,
      metadata: {
        hasProfile,
      },
    });
  }, [authStatus, myProfile, onEvent, userId, viewer]);

  let content: React.ReactNode;

  if (authStatus === "loading") {
    content = <DefaultLoadingState message={loadingMessage} />;
  } else if (!viewer || authStatus === "unauthenticated") {
    content = <DefaultSignedOutState copy={resolvedCopy} message={signedOutMessage} href={signInHref} label={signInLabel} />;
  } else {
    const hasProfile = Boolean(myProfile);
    const nextAction = buildNextAction(resolvedCopy, hasProfile, inbox.length, availableSigners.length);

    content = (
      <AutographExchangeScreen
        error={error}
        statusMessage={viewModel.statusMessage}
        nextAction={nextAction}
        hasProfile={hasProfile}
        myProfile={myProfile}
        availableSigners={availableSigners}
        inbox={inbox}
        outbox={outbox}
        filteredArchive={viewModel.filteredArchive}
        hasMoreArchive={viewModel.hasMoreArchive}
        archiveLoadingMore={viewModel.archiveLoadingMore}
        onLoadMoreArchive={viewModel.onLoadMoreArchive}
        loading={loading}
        busyAction={busyAction}
        roleOptions={viewModel.roleOptions}
        profileForm={viewModel.profileForm}
        setProfileForm={viewModel.setProfileForm}
        requestForm={viewModel.requestForm}
        setRequestForm={viewModel.setRequestForm}
        signatureDrafts={viewModel.signatureDrafts}
        setSignatureDrafts={viewModel.setSignatureDrafts}
        expandedRequestId={viewModel.expandedRequestId}
        setExpandedRequestId={viewModel.setExpandedRequestId}
        archiveFilter={viewModel.archiveFilter}
        setArchiveFilter={viewModel.setArchiveFilter}
        archiveSort={viewModel.archiveSort}
        setArchiveSort={viewModel.setArchiveSort}
        lastCreatedRequest={viewModel.lastCreatedRequest}
        lastSignedRequestId={viewModel.lastSignedRequestId}
        signaturePreset={viewModel.signaturePreset}
        effectiveProfileName={viewModel.effectiveProfileName}
        effectiveProfileRole={viewModel.effectiveProfileRole}
        sessionIdentity={viewModel.sessionIdentity}
        onProfileSubmit={viewModel.handleProfileSubmit}
        onRequestSubmit={viewModel.handleRequestSubmit}
        onSignRequest={viewModel.handleSign}
        renderSignaturePreview={
          renderSignaturePreview ?? ((preset, previewId) => <SignaturePreview preset={preset} previewId={previewId} />)
        }
        copy={resolvedCopy}
      />
    );
  }

  return <>{renderShell ? renderShell(content) : content}</>;
}
