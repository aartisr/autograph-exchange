"use client";

import React, { useEffect, useRef } from "react";
import { AutographExchangeScreen } from "./AutographExchangeScreen";
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
  message,
  href,
  label,
}: {
  message: string;
  href: string;
  label: string;
}) {
  return (
    <section className="autograph-feature-state">
      <div className="autograph-feature-card autograph-feature-card-signed-out">
        <div className="autograph-feature-intro">
          <p className="autograph-feature-eyebrow">Autograph Exchange</p>
          <h2 className="autograph-feature-title">A warm, simple place to ask and give autographs</h2>
          <p className="autograph-feature-copy">{message}</p>
        </div>
        <div className="autograph-feature-benefits" aria-label="Why autograph exchange feels easy">
          <article className="autograph-feature-benefit">
            <p className="autograph-feature-benefit-title">Ask with context</p>
            <p className="autograph-feature-benefit-copy">Choose one person and explain why their autograph matters to you.</p>
          </article>
          <article className="autograph-feature-benefit">
            <p className="autograph-feature-benefit-title">Reply without confusion</p>
            <p className="autograph-feature-benefit-copy">Incoming requests stay in one clear inbox until you respond.</p>
          </article>
          <article className="autograph-feature-benefit">
            <p className="autograph-feature-benefit-title">Keep every memory</p>
            <p className="autograph-feature-benefit-copy">Signed autographs are saved in one archive you can revisit anytime.</p>
          </article>
        </div>
        <a href={href} className="autograph-feature-cta">
          {label}
        </a>
      </div>
    </section>
  );
}

function buildNextAction(hasProfile: boolean, inboxCount: number, signerCount: number) {
  if (!hasProfile) {
    return "Start by saving your profile so people know who you are.";
  }

  if (inboxCount > 0) {
    return "You have autograph requests waiting. Open one and reply with your autograph.";
  }

  if (signerCount > 0) {
    return "Pick one person and ask for an autograph with a short personal note.";
  }

  return "You are ready. Once others create profiles, you can start exchanging autographs.";
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
  const {
    myProfile,
    availableSigners,
    inbox,
    outbox,
    archive,
    loading,
    error,
    busyAction,
    saveProfile,
    requestAutograph,
    signAutograph,
  } = useAutographExchange(userId, api, onEvent);

  const viewModel = useAutographExchangeViewModel({
    roleLabels,
    userId,
    sessionName: viewer?.name,
    sessionEmail: viewer?.email,
    profileDisplayName: myProfile?.displayName,
    profileRole: myProfile?.role,
    archive,
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
    content = <DefaultSignedOutState message={signedOutMessage} href={signInHref} label={signInLabel} />;
  } else {
    const hasProfile = Boolean(myProfile);
    const nextAction = buildNextAction(hasProfile, inbox.length, availableSigners.length);

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
        copy={copy}
      />
    );
  }

  return <>{renderShell ? renderShell(content) : content}</>;
}
