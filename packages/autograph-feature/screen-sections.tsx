"use client";

import React from "react";
import type {
  ArchiveSort,
  AutographExchangeCopy,
  AutographProfile,
  AutographRequest,
  AutographRole,
  ProfileFormState,
  RequestFormState,
  RoleOption,
  SignaturePreset,
} from "./types";
import {
  buildCollectionSummary,
  buildKeepsakeBadge,
  buildKeepsakeShareText,
  buildKeepsakeText,
  buildKeepsakeSvg,
  buildMomentumState,
  formatRelativeDate,
  INPUT_CLASS,
  REQUEST_PROMPTS,
  rolePairLabel,
  SIGNATURE_IDEAS,
  titleCaseRole,
} from "./screen-utils";
import { MemoizedSignerCombobox } from "./signer-combobox";

const SECTION_IDS = {
  outbox: "autograph-requests-sent",
  inbox: "autograph-requests-for-you",
  archive: "autograph-signed-autographs",
  composer: "autograph-request-composer",
} as const;

type HeroJumpTarget = {
  count: number;
  href: string;
  label: string;
  toneClassName: string;
};

function scrollToSection(sectionId: string) {
  if (typeof document === "undefined") {
    return;
  }

  const target = document.getElementById(sectionId);
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

interface HeroJumpStatProps extends HeroJumpTarget {}

function HeroJumpStat({ count, href, label, toneClassName }: HeroJumpStatProps) {
  return (
    <a
      className={`autograph-stat autograph-stat-link ${toneClassName}`}
      href={href}
      onClick={(event) => {
        event.preventDefault();
        scrollToSection(href.slice(1));
      }}
    >
      <span className="autograph-stat-label">{label}</span>
      <span className="autograph-stat-value">{count}</span>
    </a>
  );
}

interface StatusPillProps {
  status: AutographRequest["status"];
}

function StatusPill({ status }: StatusPillProps) {
  return (
    <span
      className={`autograph-status-pill ${status === "pending" ? "is-pending" : "is-signed"}`}
      data-testid={`status-${status}`}
    >
      {status === "pending" ? "Pending" : "Signed"}
    </span>
  );
}

interface QuickStepProps {
  step: string;
  title: string;
  detail: string;
}

function QuickStep({ step, title, detail }: QuickStepProps) {
  return (
    <article className="autograph-quick-step">
      <span className="autograph-quick-step-number" aria-hidden="true">
        {step}
      </span>
      <div className="autograph-quick-step-copy">
        <p className="autograph-quick-step-title">{title}</p>
        <p className="autograph-quick-step-detail">{detail}</p>
      </div>
    </article>
  );
}

interface SectionFocusPillProps {
  label: string;
}

function SectionFocusPill({ label }: SectionFocusPillProps) {
  return <span className="autograph-focus-pill">{label}</span>;
}

async function copyKeepsakeText(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  throw new Error("Clipboard unavailable");
}

async function shareKeepsakeText(text: string, title: string) {
  if (typeof navigator !== "undefined" && "share" in navigator) {
    await navigator.share({ title, text });
    return true;
  }

  return false;
}

function downloadKeepsakeText(filename: string, text: string) {
  if (typeof document === "undefined") {
    return;
  }

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export interface MomentumSectionProps {
  copy: AutographExchangeCopy;
  hasProfile: boolean;
  outboxCount: number;
  archiveCount: number;
  lastSignedRequestId: string | null;
}

function MomentumSectionComponent({
  copy,
  hasProfile,
  outboxCount,
  archiveCount,
  lastSignedRequestId,
}: MomentumSectionProps) {
  const titleId = React.useId();
  const momentum = buildMomentumState({
    copy,
    hasProfile,
    outboxCount,
    archiveCount,
    lastSignedRequestId,
  });

  return (
    <section className="app-surface-card autograph-momentum-card" aria-labelledby={titleId}>
      <div className="autograph-momentum-header">
        <div>
          <p className="autograph-momentum-kicker">{copy.nextMilestoneLabel}</p>
          <h3 id={titleId} className="autograph-section-title">
            {copy.journeyTitle}
          </h3>
          <p className="autograph-section-copy autograph-momentum-copy">{copy.journeySubtitle}</p>
        </div>
        <div className="autograph-momentum-progress">
          <span className="autograph-momentum-progress-value">{momentum.completionPercent}%</span>
          <span className="autograph-momentum-progress-label">complete</span>
        </div>
      </div>

      <div className="autograph-momentum-bar" aria-hidden="true">
        <span className="autograph-momentum-bar-fill" style={{ width: `${momentum.completionPercent}%` }} />
      </div>

      <div className="autograph-momentum-grid">
        {momentum.steps.map((step) => (
          <article
            key={step.id}
            className={`autograph-momentum-step ${step.completed ? "is-complete" : "is-pending"}`}
          >
            <div className="autograph-momentum-step-header">
              <p className="autograph-momentum-step-label">{step.label}</p>
              <span className="autograph-momentum-step-status">{step.completed ? "Done" : "Next"}</span>
            </div>
            <p className="autograph-momentum-step-value">{step.value}</p>
          </article>
        ))}
      </div>

      <div className="autograph-context-panel autograph-momentum-callout">
        <p className="autograph-context-label">{copy.nextMilestoneLabel}</p>
        <p className="autograph-context-title">{momentum.nextTitle}</p>
        <p className="autograph-context-detail">{momentum.nextDetail}</p>
      </div>

      {momentum.celebrationTitle ? (
        <div className="autograph-step-state autograph-step-state-success autograph-celebration-banner" role="status" aria-live="polite">
          <p className="autograph-step-state-title">{momentum.celebrationTitle}</p>
          <p className="autograph-step-state-copy">{momentum.celebrationDetail}</p>
        </div>
      ) : null}
    </section>
  );
}

export const MomentumSection = React.memo(MomentumSectionComponent);

export interface HeroSectionProps {
  copy: AutographExchangeCopy;
  nextAction: string;
  outboxCount: number;
  inboxCount: number;
  archiveCount: number;
}

function HeroSectionComponent({
  copy,
  nextAction,
  outboxCount,
  inboxCount,
  archiveCount,
}: HeroSectionProps) {
  const titleId = React.useId();
  const jumpTargets: HeroJumpTarget[] = [
    {
      count: outboxCount,
      href: `#${SECTION_IDS.outbox}`,
      label: copy.requestsSent,
      toneClassName: "autograph-stat-sent autograph-tone-sent",
    },
    {
      count: inboxCount,
      href: `#${SECTION_IDS.inbox}`,
      label: copy.requestsForYou,
      toneClassName: "autograph-stat-inbox autograph-tone-inbox",
    },
    {
      count: archiveCount,
      href: `#${SECTION_IDS.archive}`,
      label: copy.signedAutographs,
      toneClassName: "autograph-stat-archive autograph-tone-archive",
    },
  ];

  return (
    <section className="autograph-hero" aria-labelledby={titleId}>
      <div className="autograph-hero-copy">
        <p className="autograph-hero-kicker">{copy.heroKicker}</p>
        <h2 id={titleId} className="autograph-hero-title">
          {copy.heroTitle}
        </h2>
        <div className="autograph-hero-guidance">
          <p className="autograph-hero-guidance-label">What to do next</p>
          <p className="autograph-hero-description">{nextAction}</p>
        </div>
      </div>
      <div className="autograph-hero-stats">
        {jumpTargets.map((target) => (
          <HeroJumpStat key={target.href} {...target} />
        ))}
      </div>
      <div className="autograph-quick-steps" aria-label="How autograph exchange works">
        <QuickStep step="1" title={copy.stepOneTitle} detail={copy.stepOneDetail} />
        <QuickStep step="2" title={copy.stepTwoTitle} detail={copy.stepTwoDetail} />
        <QuickStep step="3" title={copy.stepThreeTitle} detail={copy.stepThreeDetail} />
      </div>
    </section>
  );
}

export const HeroSection = React.memo(HeroSectionComponent);

export interface ProfileSectionProps {
  copy: AutographExchangeCopy;
  hasProfile: boolean;
  isFocused: boolean;
  isEditingProfile: boolean;
  setIsEditingProfile: React.Dispatch<React.SetStateAction<boolean>>;
  effectiveProfileName: string;
  effectiveProfileRole: AutographRole;
  sessionIdentity: string;
  profileForm: ProfileFormState;
  setProfileForm: React.Dispatch<React.SetStateAction<ProfileFormState>>;
  roleOptions: RoleOption[];
  busyAction: string | null;
  onProfileSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<boolean>;
}

export function ProfileSection({
  copy,
  hasProfile,
  isFocused,
  isEditingProfile,
  setIsEditingProfile,
  effectiveProfileName,
  effectiveProfileRole,
  sessionIdentity,
  profileForm,
  setProfileForm,
  roleOptions,
  busyAction,
  onProfileSubmit,
}: ProfileSectionProps) {
  const titleId = React.useId();
  const nameHintId = React.useId();
  const roleHintId = React.useId();

  return (
    <section
      className={`app-surface-card autograph-setup-card autograph-section-card ${isFocused ? "is-focused-section" : ""}`}
      aria-labelledby={titleId}
    >
      <header className="autograph-section-header">
        <p className="autograph-section-step">{copy.stepOne}</p>
        <div className="autograph-section-heading">
          <div>
            <h3 id={titleId} className="autograph-section-title">
              Your autograph profile
            </h3>
            <p className="app-copy-soft autograph-section-copy">
              {hasProfile
                ? "Your profile is already saved, so you can skip this step unless you want to edit it."
                : "Save your display name and role once so people can ask you for an autograph."}
            </p>
          </div>
          <div className="autograph-section-badges">
            {isFocused ? <SectionFocusPill label={hasProfile ? "Optional now" : "Start here"} /> : null}
            <span className={`autograph-setup-badge ${hasProfile ? "is-ready" : "is-action"}`}>
              {hasProfile ? copy.stepReady : copy.stepNeededOnce}
            </span>
          </div>
        </div>
      </header>
      {hasProfile && !isEditingProfile ? (
        <div className="autograph-context-panel">
          <div className="autograph-step-state autograph-step-state-success" role="status" aria-live="polite">
            <p className="autograph-step-state-title">{copy.profileCompleteTitle}</p>
            <p className="autograph-step-state-copy">{copy.profileCompleteHint}</p>
          </div>
          <div className="autograph-profile-summary">
            <p className="autograph-context-title">{effectiveProfileName}</p>
            <div className="autograph-role-summary">
              <span className="autograph-role-summary-label">{copy.savedRoleLabel}</span>
              <span className="autograph-role-chip">{titleCaseRole(effectiveProfileRole)}</span>
            </div>
          </div>
          <p className="autograph-context-detail">{copy.profileSkipHint}</p>
          <div className="autograph-request-actions start">
            <a className="autograph-jump-link autograph-jump-link--premium" href={`#${SECTION_IDS.composer}`}>
              {copy.jumpToStepTwo}
            </a>
            <button type="button" className="autograph-secondary-btn" onClick={() => setIsEditingProfile(true)}>
              {copy.editProfile}
            </button>
          </div>
        </div>
      ) : (
        <form
          className="autograph-form-grid autograph-profile-grid"
          onSubmit={async (event) => {
            const saved = await onProfileSubmit(event);
            if (saved) {
              setIsEditingProfile(false);
            }
          }}
        >
          <div className="autograph-step-state autograph-step-state-warning" role="status" aria-live="polite">
            <p className="autograph-step-state-title">{copy.profileMissingTitle}</p>
            <p className="autograph-step-state-copy">{copy.profileMissingHint}</p>
          </div>
          <div className="autograph-context-panel compact autograph-identity-panel">
            <p className="autograph-context-label">{copy.signedInIdentityLabel}</p>
            <p className="autograph-context-title">{sessionIdentity}</p>
            <p className="autograph-context-detail">{copy.signedInIdentityHint}</p>
          </div>
          <label className="autograph-field">
            <span className="app-form-label">Display name</span>
            <input
              className={INPUT_CLASS}
              value={profileForm.displayName}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, displayName: event.target.value }))}
              placeholder={effectiveProfileName}
              aria-describedby={nameHintId}
            />
            <p id={nameHintId} className="autograph-field-hint">
              Use the name you want people to recognize right away.
            </p>
          </label>
          <label className="autograph-field">
            <span className="app-form-label">Role</span>
            <select
              className={INPUT_CLASS}
              value={profileForm.role || effectiveProfileRole}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, role: event.target.value as AutographRole }))}
              aria-describedby={roleHintId}
            >
              {roleOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <p id={roleHintId} className="autograph-field-hint">
              Your role adds context so requests feel more personal.
            </p>
          </label>
          <div className="autograph-form-actions autograph-form-actions-end">
            <button type="submit" className="app-button-primary autograph-button-fill" disabled={busyAction === "profile"}>
              {busyAction === "profile" ? "Saving profile..." : hasProfile ? copy.saveChanges : "Save profile"}
            </button>
            {hasProfile ? (
              <button
                type="button"
                className="autograph-secondary-btn"
                onClick={() => setIsEditingProfile(false)}
                disabled={busyAction === "profile"}
              >
                {copy.cancel}
              </button>
            ) : null}
          </div>
        </form>
      )}
      <p className="autograph-inline-note">
        {copy.profileAudiencePrefix} <strong>{effectiveProfileName || "you"}</strong> and can request an autograph from you as a{" "}
        <strong>{titleCaseRole(profileForm.role || effectiveProfileRole)}</strong>.
      </p>
    </section>
  );
}

export interface RequestComposerSectionProps {
  copy: AutographExchangeCopy;
  hasProfile: boolean;
  isFocused: boolean;
  loading: boolean;
  myProfile: AutographProfile | null;
  availableSigners: AutographProfile[];
  requestForm: RequestFormState;
  setRequestForm: React.Dispatch<React.SetStateAction<RequestFormState>>;
  busyAction: string | null;
  onRequestSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function RequestComposerSection({
  copy,
  hasProfile,
  isFocused,
  loading,
  myProfile,
  availableSigners,
  requestForm,
  setRequestForm,
  busyAction,
  onRequestSubmit,
}: RequestComposerSectionProps) {
  const titleId = React.useId();
  const signerHintId = React.useId();
  const messageHintId = React.useId();
  const selectedSigner = availableSigners.find((profile) => profile.userId === requestForm.signerUserId) ?? null;
  const requestMessageLength = requestForm.message.trim().length;

  return (
    <section
      id={SECTION_IDS.composer}
      className={`app-surface-card autograph-setup-card autograph-section-card autograph-scroll-target ${isFocused ? "is-focused-section" : ""}`}
      aria-labelledby={titleId}
    >
      <header className="autograph-section-header">
        <p className="autograph-section-step">{copy.stepTwo}</p>
        <div className="autograph-section-heading">
          <div>
            <h3 id={titleId} className="autograph-section-title">
              Ask someone for an autograph
            </h3>
            <p className="app-copy-soft autograph-section-copy">{copy.requestExplainer}</p>
          </div>
          <div className="autograph-section-badges">
            {isFocused ? <SectionFocusPill label={hasProfile ? "Start here" : "Locked"} /> : null}
            <span className={`autograph-setup-badge ${hasProfile ? "is-ready" : ""}`}>
              {hasProfile ? copy.stepCanAsk : copy.stepCompleteFirst}
            </span>
          </div>
        </div>
      </header>
      <form className="autograph-form-grid autograph-composer-grid" onSubmit={onRequestSubmit}>
        <MemoizedSignerCombobox
          copy={copy}
          availableSigners={availableSigners}
          requestForm={requestForm}
          setRequestForm={setRequestForm}
          hintId={signerHintId}
        />
        <label className="autograph-field">
          <span className="app-form-label">{copy.whyAreYouAsking}</span>
          <textarea
            className={INPUT_CLASS}
            rows={3}
            value={requestForm.message}
            onChange={(event) => setRequestForm((prev) => ({ ...prev, message: event.target.value }))}
            placeholder="Say why you are asking and what you would love them to write."
            maxLength={240}
            required
            aria-describedby={`${messageHintId} autograph-request-count`}
          />
          <p id={messageHintId} className="autograph-field-hint">
            A few sincere lines are enough. Specific requests usually get warmer replies.
          </p>
        </label>
        <div className="autograph-suggestion-row" aria-label={copy.requestIdeasLabel}>
          {REQUEST_PROMPTS.map((prompt) => (
            <button
              key={prompt.label}
              type="button"
              className="autograph-suggestion-chip"
              onClick={() => setRequestForm((prev) => ({ ...prev, message: prompt.text }))}
            >
              {prompt.label}
            </button>
          ))}
        </div>
        {selectedSigner ? (
          <div className="autograph-context-panel">
            <p className="autograph-context-label">{copy.youAreAsking}</p>
            <p className="autograph-context-title">
              {selectedSigner.displayName} · {titleCaseRole(selectedSigner.role)}
            </p>
            <p className="autograph-context-detail">
              {copy.signerInboxHintPrefix} {myProfile?.displayName ?? "you"} and can sign it from their inbox.
            </p>
          </div>
        ) : null}
        <div className="autograph-form-meta">
          <p className="autograph-inline-note">
            Clear, specific requests feel more personal and are easier to answer well.
          </p>
          <span id="autograph-request-count" className="autograph-char-count">
            {requestMessageLength}/240
          </span>
        </div>
        {availableSigners.length > 0 ? <p className="autograph-inline-note">{copy.signerListHint}</p> : null}
        <div className="autograph-form-actions">
          <button type="submit" className="app-button-primary" disabled={busyAction === "request" || !hasProfile}>
            <span>{busyAction === "request" ? "Sending request..." : copy.askForAutograph}</span>
          </button>
        </div>
      </form>
      {!hasProfile ? <p className="app-copy-soft autograph-helper-text">{copy.saveProfileFirstHint}</p> : null}
      {!loading && availableSigners.length === 0 ? <p className="app-copy-soft autograph-helper-text">{copy.noOtherProfiles}</p> : null}
    </section>
  );
}

export interface InboxLaneProps {
  copy: AutographExchangeCopy;
  inbox: AutographRequest[];
  isFocused: boolean;
  lastSignedRequestId: string | null;
  expandedRequestId: string | null;
  setExpandedRequestId: React.Dispatch<React.SetStateAction<string | null>>;
  signaturePreset: SignaturePreset;
  signatureDrafts: Record<string, string>;
  setSignatureDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  busyAction: string | null;
  renderSignaturePreview: (preset: SignaturePreset, previewId: string) => React.ReactNode;
  onSignRequest: (requestId: string) => Promise<void>;
}

export function InboxLane({
  copy,
  inbox,
  isFocused,
  lastSignedRequestId,
  expandedRequestId,
  setExpandedRequestId,
  signaturePreset,
  signatureDrafts,
  setSignatureDrafts,
  busyAction,
  renderSignaturePreview,
  onSignRequest,
}: InboxLaneProps) {
  const titleId = React.useId();

  return (
    <section
      id={SECTION_IDS.inbox}
      className={`autograph-lane autograph-lane-pending autograph-tone-inbox autograph-scroll-target ${isFocused ? "is-focused-section" : ""}`}
      aria-labelledby={titleId}
    >
      <header className="autograph-lane-header">
        <div>
          <h3 id={titleId} className="autograph-lane-title">
            {copy.requestsForYou}
          </h3>
          <p className="autograph-lane-subtitle">{copy.inboxSubtitle}</p>
        </div>
        <div className="autograph-lane-header-actions">
          {isFocused ? <SectionFocusPill label="Waiting on you" /> : null}
          <p className="autograph-lane-meta">
            {inbox.length} {copy.waitingCountSuffix}
          </p>
        </div>
      </header>
      {inbox.length === 0 ? (
        <p className="app-copy-soft autograph-empty">{copy.noInbox}</p>
      ) : (
        inbox.map((item) => (
          <article
            key={item.id}
            className={`autograph-request-card ${lastSignedRequestId === item.id ? "is-just-signed" : ""}`}
            data-testid="pending-request-card"
          >
            <div className="autograph-request-card-header">
              <p className="autograph-card-title">
                {copy.fromPrefix} {item.requesterDisplayName}
              </p>
              <StatusPill status={item.status} />
            </div>
            <p className="autograph-request-pair">{rolePairLabel(item)}</p>
            <div className="autograph-context-panel compact">
              <p className="autograph-context-label">{copy.theyAsked}</p>
              <p className="autograph-context-detail">{item.message}</p>
            </div>
            <p className="autograph-request-time">
              {copy.requestedPrefix} {formatRelativeDate(item.createdAt, copy)}
            </p>

            <div className="autograph-request-actions">
              <button
                type="button"
                className="autograph-secondary-btn"
                onClick={() => setExpandedRequestId((prev) => (prev === item.id ? null : item.id))}
                aria-label={`Open signing form for ${item.requesterDisplayName}`}
                aria-expanded={expandedRequestId === item.id}
                aria-controls={`autograph-sign-panel-${item.id}`}
              >
                {expandedRequestId === item.id ? copy.hideReplyBox : copy.writeAutograph}
              </button>
            </div>

            {expandedRequestId === item.id ? (
              <div id={`autograph-sign-panel-${item.id}`} className="autograph-sign-panel" data-testid="sign-editor">
                {renderSignaturePreview(signaturePreset, item.id)}
                <label className="autograph-field">
                  <span className="app-form-label">{copy.yourAutographLabel}</span>
                  <textarea
                    id={`autograph-signature-${item.id}`}
                    className={INPUT_CLASS}
                    rows={3}
                    value={signatureDrafts[item.id] ?? ""}
                    placeholder="Write the autograph you want to give them."
                    maxLength={240}
                    onChange={(event) => setSignatureDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))}
                    aria-describedby={`autograph-signature-hint-${item.id} autograph-signature-count-${item.id}`}
                  />
                  <p id={`autograph-signature-hint-${item.id}`} className="autograph-field-hint">
                    Keep it brief, warm, and personal. One thoughtful paragraph is plenty.
                  </p>
                </label>
                <div className="autograph-suggestion-row" aria-label={copy.autographIdeasLabel}>
                  {SIGNATURE_IDEAS.map((idea) => (
                    <button
                      key={`${item.id}-${idea.label}`}
                      className="autograph-suggestion-chip"
                      type="button"
                      onClick={() => setSignatureDrafts((prev) => ({ ...prev, [item.id]: idea.text }))}
                    >
                      {idea.label}
                    </button>
                  ))}
                </div>
                <div className="autograph-sign-footer">
                  <span id={`autograph-signature-count-${item.id}`} className="autograph-char-count">
                    {(signatureDrafts[item.id] ?? "").trim().length}/240
                  </span>
                  <button
                    className="autograph-secondary-btn"
                    onClick={() => setSignatureDrafts((prev) => ({ ...prev, [item.id]: `Signed by ${signaturePreset.label}` }))}
                    type="button"
                  >
                    {copy.useGeneratedSignature}
                  </button>
                  <button
                    className="app-button-primary"
                    onClick={() => void onSignRequest(item.id)}
                    disabled={busyAction === `sign:${item.id}` || !(signatureDrafts[item.id] ?? "").trim()}
                  >
                    {busyAction === `sign:${item.id}` ? copy.signing : copy.confirmSignature}
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        ))
      )}
    </section>
  );
}

export interface ArchiveLaneProps {
  copy: AutographExchangeCopy;
  filteredArchive: AutographRequest[];
  isFocused: boolean;
  archiveFilter: string;
  setArchiveFilter: React.Dispatch<React.SetStateAction<string>>;
  archiveSort: ArchiveSort;
  setArchiveSort: React.Dispatch<React.SetStateAction<ArchiveSort>>;
  lastSignedRequestId: string | null;
}

export function ArchiveLane({
  copy,
  filteredArchive,
  isFocused,
  archiveFilter,
  setArchiveFilter,
  archiveSort,
  setArchiveSort,
  lastSignedRequestId,
}: ArchiveLaneProps) {
  const titleId = React.useId();
  const spotlightItem = filteredArchive[0] ?? null;
  const revealItem = lastSignedRequestId
    ? filteredArchive.find((item) => item.id === lastSignedRequestId) ?? null
    : null;
  const [keepsakeStatus, setKeepsakeStatus] = React.useState<string | null>(null);

  async function handleShare(item: AutographRequest) {
    const title = `${item.requesterDisplayName} ↔ ${item.signerDisplayName}`;
    const text = buildKeepsakeShareText(copy, item);
    try {
      const shared = await shareKeepsakeText(text, title);

      if (shared) {
        setKeepsakeStatus(copy.keepsakeSharedStatus);
        return;
      }

      await copyKeepsakeText(text);
      setKeepsakeStatus(copy.keepsakeCopiedStatus);
    } catch {
      setKeepsakeStatus(copy.keepsakeUnavailableStatus);
    }
  }

  async function handleCopy(item: AutographRequest) {
    try {
      await copyKeepsakeText(buildKeepsakeShareText(copy, item));
      setKeepsakeStatus(copy.keepsakeCopiedStatus);
    } catch {
      setKeepsakeStatus(copy.keepsakeUnavailableStatus);
    }
  }

  function handleDownload(item: AutographRequest) {
    const safeName = `${item.requesterDisplayName}-${item.signerDisplayName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);

    downloadKeepsakeText(`${safeName || "autograph-keepsake"}.svg`, buildKeepsakeSvg(copy, item));
    setKeepsakeStatus(copy.keepsakeDownloadedStatus);
  }

  return (
    <section
      id={SECTION_IDS.archive}
      className={`autograph-lane autograph-lane-archive autograph-tone-archive autograph-scroll-target ${isFocused ? "is-focused-section" : ""}`}
      aria-labelledby={titleId}
    >
      <div className="autograph-live-region" aria-live="polite" aria-atomic="true">
        {keepsakeStatus ? <p className="autograph-status-banner">{keepsakeStatus}</p> : null}
      </div>
      <header className="autograph-lane-header">
        <div>
          <h3 id={titleId} className="autograph-lane-title">
            {copy.signedAutographs}
          </h3>
          <p className="autograph-lane-subtitle">{copy.archiveSubtitle}</p>
        </div>
        <div className="autograph-lane-header-actions">
          {isFocused ? <SectionFocusPill label="Browse here" /> : null}
          <p className="autograph-lane-meta">
            {filteredArchive.length} {copy.totalCountSuffix}
          </p>
        </div>
      </header>
      {revealItem ? (
        <article className="autograph-reveal-card" aria-live="polite">
          <div className="autograph-reveal-header">
            <div>
              <p className="autograph-context-label">{copy.revealLabel}</p>
              <h4 className="autograph-reveal-title">{copy.revealTitle}</h4>
              <p className="autograph-reveal-subtitle">{copy.revealSubtitle}</p>
            </div>
            <span className="autograph-keepsake-badge is-new">{copy.newKeepsakeLabel}</span>
          </div>
          <div className="autograph-reveal-body">
            <p className="autograph-reveal-from">
              {copy.revealFromLabel} <strong>{revealItem.signerDisplayName}</strong>
            </p>
            <div className="autograph-social-card">
              <p className="autograph-social-card-label">{copy.socialKeepsakeLabel}</p>
              <p className="autograph-social-card-title">{revealItem.requesterDisplayName} ↔ {revealItem.signerDisplayName}</p>
              <blockquote className="autograph-social-card-quote">“{revealItem.signatureText}”</blockquote>
            </div>
            <blockquote className="autograph-signature-quote autograph-signature-quote-reveal">“{revealItem.signatureText}”</blockquote>
            <p className="autograph-request-time">
              {copy.signedPrefix} {formatRelativeDate(revealItem.signedAt ?? revealItem.createdAt, copy)}
            </p>
            <div className="autograph-keepsake-actions">
              <button type="button" className="autograph-secondary-btn" onClick={() => void handleShare(revealItem)}>
                {copy.shareKeepsakeLabel}
              </button>
              <button type="button" className="autograph-secondary-btn" onClick={() => void handleCopy(revealItem)}>
                {copy.copyKeepsakeLabel}
              </button>
              <button type="button" className="autograph-secondary-btn" onClick={() => handleDownload(revealItem)}>
                {copy.downloadKeepsakeLabel}
              </button>
            </div>
          </div>
        </article>
      ) : null}
      {spotlightItem ? (
        <div className="autograph-collection-spotlight">
          <div className="autograph-collection-spotlight-copy">
            <p className="autograph-context-label">{copy.collectionTitle}</p>
            <p className="autograph-context-title">
              {
                buildKeepsakeBadge({
                  copy,
                  index: 0,
                  isNew: lastSignedRequestId === spotlightItem.id,
                }).label
              }
            </p>
            <p className="autograph-context-detail">{buildCollectionSummary(copy, filteredArchive.length)}</p>
          </div>
          <div className="autograph-collection-spotlight-meta">
            <span className="autograph-collection-count">{filteredArchive.length}</span>
            <span className="autograph-collection-count-label">{copy.signedAutographs}</span>
          </div>
        </div>
      ) : null}
      <div className="autograph-archive-controls">
        <label className="autograph-field">
          <span className="autograph-visually-hidden">{copy.searchLabel}</span>
          <input
            id="autograph-archive-search"
            value={archiveFilter}
            onChange={(event) => setArchiveFilter(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className={`${INPUT_CLASS} autograph-filter-input`}
            aria-label={copy.searchLabel}
          />
        </label>
        <label className="autograph-field">
          <span className="autograph-visually-hidden">{copy.sortLabel}</span>
          <select
            id="autograph-archive-sort"
            value={archiveSort}
            onChange={(event) => setArchiveSort(event.target.value as ArchiveSort)}
            className={`${INPUT_CLASS} autograph-sort-select`}
            aria-label={copy.sortLabel}
          >
            <option value="newest">{copy.newestFirst}</option>
            <option value="oldest">{copy.oldestFirst}</option>
          </select>
        </label>
      </div>
      {filteredArchive.length === 0 ? (
        <p className="app-copy-soft autograph-empty">{copy.noArchive}</p>
      ) : (
        filteredArchive.map((item, index) => {
          const keepsakeBadge = buildKeepsakeBadge({
            copy,
            index,
            isNew: lastSignedRequestId === item.id,
          });

          return (
            <article
              key={item.id}
              className={`autograph-archive-card ${lastSignedRequestId === item.id ? "is-highlight" : ""}`}
              data-testid="signed-request-card"
            >
              <div className="autograph-request-card-header">
                <div className="autograph-archive-card-heading">
                  <div className="autograph-archive-card-meta">
                    <span className={`autograph-keepsake-badge is-${keepsakeBadge.tone}`}>{keepsakeBadge.label}</span>
                    <span className="autograph-keepsake-piece">
                      {copy.collectionPieceLabel} #{filteredArchive.length - index}
                    </span>
                  </div>
                  <p className="autograph-card-title">
                    {item.requesterDisplayName} ↔ {item.signerDisplayName}
                  </p>
                </div>
                <StatusPill status={item.status} />
              </div>
              <p className="autograph-request-pair">{rolePairLabel(item)}</p>
              <div className="autograph-keepsake-stack">
                <div className="autograph-social-card">
                  <p className="autograph-social-card-label">{copy.socialKeepsakeLabel}</p>
                  <p className="autograph-social-card-title">{item.requesterDisplayName} ↔ {item.signerDisplayName}</p>
                  <blockquote className="autograph-social-card-quote">“{item.signatureText}”</blockquote>
                </div>
                <div className="autograph-keepsake-panel">
                  <p className="autograph-keepsake-panel-label">{copy.keepsakeMessageLabel}</p>
                  <p className="autograph-archive-message app-copy-soft">{item.message}</p>
                </div>
                <div className="autograph-keepsake-panel autograph-keepsake-panel-signature">
                  <p className="autograph-keepsake-panel-label">{copy.keepsakeAutographLabel}</p>
                  <blockquote className="autograph-signature-quote">“{item.signatureText}”</blockquote>
                </div>
              </div>
              <div className="autograph-archive-card-footer">
                <div className="autograph-keepsake-memory">
                  <p className="autograph-keepsake-panel-label">{copy.keepsakeMemoryLabel}</p>
                  <p className="autograph-request-time">
                    {copy.signedPrefix} {formatRelativeDate(item.signedAt ?? item.createdAt, copy)}
                  </p>
                </div>
                <p className="autograph-keepsake-footer">{copy.savedInCollectionLabel}</p>
              </div>
              <div className="autograph-keepsake-actions">
                <button type="button" className="autograph-secondary-btn" onClick={() => void handleShare(item)}>
                  {copy.shareKeepsakeLabel}
                </button>
                <button type="button" className="autograph-secondary-btn" onClick={() => void handleCopy(item)}>
                  {copy.copyKeepsakeLabel}
                </button>
                <button type="button" className="autograph-secondary-btn" onClick={() => handleDownload(item)}>
                  {copy.downloadKeepsakeLabel}
                </button>
              </div>
            </article>
          );
        })
      )}
    </section>
  );
}

export interface OutboxSectionProps {
  copy: AutographExchangeCopy;
  outbox: AutographRequest[];
  isFocused: boolean;
}

function OutboxSectionComponent({
  copy,
  outbox,
  isFocused,
}: OutboxSectionProps) {
  const titleId = React.useId();
  return (
    <section
      id={SECTION_IDS.outbox}
      className={`autograph-outbox autograph-tone-sent autograph-scroll-target ${isFocused ? "is-focused-section" : ""}`}
      aria-labelledby={titleId}
    >
      <div className="autograph-lane-header">
        <div>
          <h3 id={titleId} className="autograph-lane-title">
            {copy.requestsSent}
          </h3>
          <p className="autograph-lane-subtitle">{copy.outboxSubtitle}</p>
        </div>
        <div className="autograph-lane-header-actions">
          {isFocused ? <SectionFocusPill label="Track here" /> : null}
          <p className="autograph-lane-meta">
            {outbox.length} {copy.pendingCountSuffix}
          </p>
        </div>
      </div>
      {outbox.length === 0 ? (
        <p className="app-copy-soft autograph-helper-text">{copy.noOutbox}</p>
      ) : (
        <div className="autograph-outbox-list">
          {outbox.map((item) => (
            <article key={item.id} className="autograph-outbox-card">
              <div className="autograph-request-card-header">
                <p className="autograph-card-title">{item.signerDisplayName}</p>
                <StatusPill status={item.status} />
              </div>
              <p className="autograph-outbox-message app-copy-soft">{item.message}</p>
              <p className="autograph-request-time">{formatRelativeDate(item.createdAt, copy)}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export const OutboxSection = React.memo(OutboxSectionComponent);
