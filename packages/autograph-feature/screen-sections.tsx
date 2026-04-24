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
  rolePairLabel,
  titleCaseRole,
} from "./screen-utils";
import { MemoizedSignerCombobox } from "./signer-combobox";

const SECTION_IDS = {
  profile: "autograph-profile-setup",
  outbox: "autograph-requests-sent",
  inbox: "autograph-requests-for-you",
  archive: "autograph-signed-autographs",
  composer: "autograph-request-composer",
} as const;

type KeepsakeDownloadFormat = "svg" | "png" | "jpg" | "gif" | "pdf";

type HeroJumpTarget = {
  count: number;
  href: string;
  label: string;
  toneClassName: string;
};

type IconName =
  | "sparkles"
  | "userCircle"
  | "send"
  | "inbox"
  | "archive"
  | "trophy"
  | "bookOpen"
  | "download"
  | "copy"
  | "share"
  | "x"
  | "arrowRight";

interface DecorativeIconProps {
  name: IconName;
  className?: string;
}

function DecorativeIcon({ name, className }: DecorativeIconProps) {
  const pathByName: Record<IconName, React.ReactNode> = {
    sparkles: (
      <>
        <path d="M12 4l1.55 3.95L17.5 9.5l-3.95 1.55L12 15l-1.55-3.95L6.5 9.5l3.95-1.55L12 4z" />
        <path d="M19 3l.9 2.1L22 6l-2.1.9L19 9l-.9-2.1L16 6l2.1-.9L19 3z" />
      </>
    ),
    userCircle: (
      <>
        <circle cx="12" cy="9" r="3" />
        <path d="M6.5 18a5.5 5.5 0 0 1 11 0" />
      </>
    ),
    send: <path d="M3 11.8L21 3l-6.7 18-2.8-6.4L3 11.8z" />,
    inbox: (
      <>
        <path d="M4 6h16v11H4z" />
        <path d="M4 12h4l2 3h4l2-3h4" />
      </>
    ),
    archive: (
      <>
        <rect x="3.5" y="4" width="17" height="5" rx="1" />
        <path d="M5 9.5h14V20H5z" />
        <path d="M9 14h6" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 4h8v3a4 4 0 0 1-8 0V4z" />
        <path d="M8 6H5a2 2 0 0 0 2 3" />
        <path d="M16 6h3a2 2 0 0 1-2 3" />
        <path d="M12 11v4" />
        <path d="M9 20h6" />
      </>
    ),
    bookOpen: (
      <>
        <path d="M4 5.5c2.4-.7 5.2-.35 8 1.05v12c-2.8-1.4-5.6-1.75-8-1.05v-12z" />
        <path d="M20 5.5c-2.4-.7-5.2-.35-8 1.05v12c2.8-1.4 5.6-1.75 8-1.05v-12z" />
        <path d="M12 6.55v12" />
      </>
    ),
    download: (
      <>
        <path d="M12 4v10" />
        <path d="M8.5 11.5L12 15l3.5-3.5" />
        <path d="M5 20h14" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="10" height="11" rx="2" />
        <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
      </>
    ),
    share: (
      <>
        <circle cx="18" cy="5" r="2" />
        <circle cx="6" cy="12" r="2" />
        <circle cx="18" cy="19" r="2" />
        <path d="M8 12l8-6" />
        <path d="M8 12l8 7" />
      </>
    ),
    x: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6L6 18" />
      </>
    ),
    arrowRight: <path d="M5 12h13M13 7l5 5-5 5" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {pathByName[name]}
    </svg>
  );
}

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
  copy: AutographExchangeCopy;
}

function StatusPill({ status, copy }: StatusPillProps) {
  return (
    <span
      className={`autograph-status-pill ${status === "pending" ? "is-pending" : "is-signed"}`}
      data-testid={`status-${status}`}
    >
      {status === "pending" ? copy.pendingStatusLabel : copy.signedStatusLabel}
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

function buildRoleLabelMap(roleOptions: RoleOption[]): Partial<Record<AutographRole, string>> {
  return roleOptions.reduce<Partial<Record<AutographRole, string>>>((labels, option) => {
    labels[option.value] = option.label;
    return labels;
  }, {});
}

function getRoleLabel(role: AutographRole, roleOptions: RoleOption[]): string {
  return buildRoleLabelMap(roleOptions)[role] ?? titleCaseRole(role);
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
          <h3 id={titleId} className="autograph-section-title autograph-title-with-icon">
            <DecorativeIcon name="trophy" className="autograph-title-icon" />
            <span>{copy.journeyTitle}</span>
          </h3>
          <p className="autograph-section-copy autograph-momentum-copy">{copy.journeySubtitle}</p>
        </div>
        <div className="autograph-momentum-progress">
          <span className="autograph-momentum-progress-value">{momentum.completionPercent}%</span>
          <span className="autograph-momentum-progress-label">{copy.completeLabel}</span>
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
              <span className="autograph-momentum-step-status">{step.completed ? copy.doneLabel : copy.nextLabel}</span>
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

interface AutographBookPreviewProps {
  copy: AutographExchangeCopy;
  outboxCount: number;
  inboxCount: number;
  archiveCount: number;
}

function AutographBookPreview({
  copy,
  outboxCount,
  inboxCount,
  archiveCount,
}: AutographBookPreviewProps) {
  return (
    <aside className="autograph-book-preview" aria-label={copy.bookPreviewLabel}>
      <div className="autograph-book-preview-header">
        <span className="autograph-book-mark" aria-hidden="true">
          <DecorativeIcon name="bookOpen" className="autograph-book-mark-icon" />
        </span>
        <div>
          <p className="autograph-book-cover-label">{copy.bookCoverLabel}</p>
          <p className="autograph-book-proof-line">{copy.bookTrustLine}</p>
        </div>
      </div>

      <div className="autograph-book" aria-hidden="true">
        <div className="autograph-book-page autograph-book-page-left">
          <p className="autograph-book-page-label">{copy.bookLeftPageLabel}</p>
          <p className="autograph-book-page-title">{copy.bookLeftPageTitle}</p>
          <p className="autograph-book-page-detail">{copy.bookLeftPageDetail}</p>
          <div className="autograph-book-stat-grid">
            <span className="autograph-book-stat">
              <strong>{outboxCount}</strong>
              <span>{copy.bookSentLabel}</span>
            </span>
            <span className="autograph-book-stat">
              <strong>{inboxCount}</strong>
              <span>{copy.bookWaitingLabel}</span>
            </span>
          </div>
        </div>
        <span className="autograph-book-spine" />
        <div className="autograph-book-page autograph-book-page-right">
          <p className="autograph-book-page-label">{copy.bookRightPageLabel}</p>
          <p className="autograph-book-page-title autograph-book-signature-line">{copy.bookRightPageTitle}</p>
          <p className="autograph-book-page-detail">{copy.bookRightPageDetail}</p>
          <span className="autograph-book-saved-count">
            <strong>{archiveCount}</strong>
            <span>{copy.bookSignedLabel}</span>
          </span>
        </div>
      </div>

      <p className="autograph-book-export-line">{copy.bookExportLine}</p>
    </aside>
  );
}

export interface HeroSectionProps {
  copy: AutographExchangeCopy;
  nextAction: string;
  nextStepHref?: string;
  nextStepLabel?: string;
  outboxCount: number;
  inboxCount: number;
  archiveCount: number;
}

function HeroSectionComponent({
  copy,
  nextAction,
  nextStepHref,
  nextStepLabel,
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
        <p className="autograph-hero-kicker">
          <DecorativeIcon name="sparkles" className="autograph-inline-icon" />
          <span>{copy.heroKicker}</span>
        </p>
        <h2 id={titleId} className="autograph-hero-title">
          {copy.heroTitle}
        </h2>
        <div className="autograph-hero-guidance">
          <p className="autograph-hero-guidance-label">{copy.heroGuidanceLabel}</p>
          <p className="autograph-hero-description">{nextAction}</p>
          {nextStepHref && nextStepLabel ? (
            <a
              className="autograph-hero-next-link"
              href={nextStepHref}
              onClick={(event) => {
                event.preventDefault();
                scrollToSection(nextStepHref.slice(1));
              }}
            >
              <span>{nextStepLabel}</span>
              <DecorativeIcon name="arrowRight" className="autograph-button-icon" />
            </a>
          ) : null}
        </div>
      </div>
      <div className="autograph-hero-stats">
        {jumpTargets.map((target) => (
          <HeroJumpStat key={target.href} {...target} />
        ))}
      </div>
      <AutographBookPreview copy={copy} outboxCount={outboxCount} inboxCount={inboxCount} archiveCount={archiveCount} />
      <div className="autograph-quick-steps" aria-label={copy.quickStepsAriaLabel}>
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
  const effectiveRoleLabel = getRoleLabel(effectiveProfileRole, roleOptions);
  const previewRoleLabel = getRoleLabel(profileForm.role || effectiveProfileRole, roleOptions);

  return (
    <section
      id={SECTION_IDS.profile}
      className={`app-surface-card autograph-setup-card autograph-section-card ${isFocused ? "is-focused-section" : ""}`}
      aria-labelledby={titleId}
    >
      <header className="autograph-section-header">
        <p className="autograph-section-step">{copy.stepOne}</p>
        <div className="autograph-section-heading">
          <div>
            <h3 id={titleId} className="autograph-section-title autograph-title-with-icon">
              <DecorativeIcon name="userCircle" className="autograph-title-icon" />
              <span>{copy.profileTitle}</span>
            </h3>
            <p className="app-copy-soft autograph-section-copy">
              {hasProfile ? copy.profileCompleteDescription : copy.profileMissingDescription}
            </p>
          </div>
          <div className="autograph-section-badges">
            {isFocused ? <SectionFocusPill label={hasProfile ? copy.profileFocusOptionalLabel : copy.profileFocusStartLabel} /> : null}
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
              <span className="autograph-role-chip">{effectiveRoleLabel}</span>
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
            <span className="app-form-label">{copy.displayNameLabel}</span>
            <input
              className={INPUT_CLASS}
              value={profileForm.displayName}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, displayName: event.target.value }))}
              placeholder={effectiveProfileName}
              aria-describedby={nameHintId}
            />
            <p id={nameHintId} className="autograph-field-hint">
              {copy.displayNameHint}
            </p>
          </label>
          <label className="autograph-field">
            <span className="app-form-label">{copy.roleLabel}</span>
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
              {copy.roleHint}
            </p>
          </label>
          <div className="autograph-form-actions autograph-form-actions-end">
            <button type="submit" className="app-button-primary autograph-button-fill" disabled={busyAction === "profile"}>
              {busyAction === "profile" ? copy.savingProfile : hasProfile ? copy.saveChanges : copy.saveProfile}
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
        {copy.profileAudiencePrefix} <strong>{effectiveProfileName || copy.profileAudienceFallback}</strong> {copy.profileAudienceConnector}{" "}
        <strong>{previewRoleLabel}</strong>.
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
  roleOptions: RoleOption[];
  outbox: AutographRequest[];
  lastCreatedRequest: AutographRequest | null;
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
  roleOptions,
  outbox,
  lastCreatedRequest,
  requestForm,
  setRequestForm,
  busyAction,
  onRequestSubmit,
}: RequestComposerSectionProps) {
  const titleId = React.useId();
  const signerHintId = React.useId();
  const messageHintId = React.useId();
  const [dismissedRequestFeedbackId, setDismissedRequestFeedbackId] = React.useState<string | null>(null);
  const [composerResetKey, setComposerResetKey] = React.useState(0);
  const selectedSigner = availableSigners.find((profile) => profile.userId === requestForm.signerUserId) ?? null;
  const trimmedMessage = requestForm.message.trim();
  const requestMessageLength = trimmedMessage.length;
  const pendingRequestForSigner = selectedSigner
    ? outbox.find((item) => item.signerUserId === selectedSigner.userId && item.status === "pending") ?? null
    : null;
  const justSentCurrentDraft =
    Boolean(
      pendingRequestForSigner
        && lastCreatedRequest
        && pendingRequestForSigner.id === lastCreatedRequest.id
        && lastCreatedRequest.signerUserId === requestForm.signerUserId
        && lastCreatedRequest.message.trim() === trimmedMessage,
    );
  const isRequestSending = busyAction === "request";
  const canSubmitRequest =
    hasProfile && Boolean(selectedSigner) && requestMessageLength > 0 && !pendingRequestForSigner && !isRequestSending;
  const showRequestFeedback =
    Boolean(pendingRequestForSigner) && dismissedRequestFeedbackId !== pendingRequestForSigner?.id;
  const submitLabel =
    isRequestSending
      ? copy.sendingRequest
      : justSentCurrentDraft
        ? copy.requestSentTitle
        : pendingRequestForSigner
          ? copy.requestAlreadyPending
          : copy.askForAutograph;

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
            <h3 id={titleId} className="autograph-section-title autograph-title-with-icon">
              <DecorativeIcon name="send" className="autograph-title-icon" />
              <span>{copy.requestComposerTitle}</span>
            </h3>
            <p className="app-copy-soft autograph-section-copy">{copy.requestExplainer}</p>
          </div>
          <div className="autograph-section-badges">
            {isFocused ? <SectionFocusPill label={hasProfile ? copy.composerFocusStartLabel : copy.composerFocusLockedLabel} /> : null}
            <span className={`autograph-setup-badge ${hasProfile ? "is-ready" : ""}`}>
              {hasProfile ? copy.stepCanAsk : copy.stepCompleteFirst}
            </span>
          </div>
        </div>
      </header>
      <form className="autograph-form-grid autograph-composer-grid" onSubmit={onRequestSubmit}>
        <MemoizedSignerCombobox
          key={composerResetKey}
          copy={copy}
          availableSigners={availableSigners}
          roleOptions={roleOptions}
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
            placeholder={copy.requestMessagePlaceholder}
            maxLength={240}
            required
            aria-describedby={`${messageHintId} autograph-request-count`}
          />
          <p id={messageHintId} className="autograph-field-hint">
            {copy.requestMessageHint}
          </p>
        </label>
        <div className="autograph-suggestion-row" aria-label={copy.requestIdeasLabel}>
          {copy.requestPrompts.map((prompt) => (
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
              {selectedSigner.displayName} · {getRoleLabel(selectedSigner.role, roleOptions)}
            </p>
            <p className="autograph-context-detail">
              {copy.signerInboxHintPrefix} {myProfile?.displayName ?? copy.signerInboxFallbackName} {copy.signerInboxHintSuffix}
            </p>
          </div>
        ) : null}
        {pendingRequestForSigner && showRequestFeedback ? (
          <div
            className={`autograph-step-state ${justSentCurrentDraft ? "autograph-step-state-success" : "autograph-step-state-warning"} autograph-request-submit-state`}
            role="status"
            aria-live="polite"
          >
            <button
              type="button"
              className="autograph-feedback-dismiss"
              aria-label={copy.dismissRequestFeedback}
              onClick={() => setDismissedRequestFeedbackId(pendingRequestForSigner.id)}
            >
              <DecorativeIcon name="x" className="autograph-feedback-dismiss-icon" />
            </button>
            <p className="autograph-step-state-title">{justSentCurrentDraft ? copy.requestSentTitle : copy.requestAlreadyPending}</p>
            <p className="autograph-step-state-copy">
              {justSentCurrentDraft ? copy.requestSentDetail : copy.requestPendingForSignerHint}
            </p>
            <div className="autograph-request-submit-summary">
              <p className="autograph-context-label">{copy.youAreAsking}</p>
              <p className="autograph-context-title">
                {pendingRequestForSigner.signerDisplayName} · {getRoleLabel(pendingRequestForSigner.signerRole, roleOptions)}
              </p>
              <p className="autograph-context-detail">{pendingRequestForSigner.message}</p>
            </div>
            <div className="autograph-feedback-actions">
              <button
                type="button"
                className="autograph-secondary-btn"
                onClick={() => {
                  setRequestForm({ signerUserId: "", message: "" });
                  setComposerResetKey((prev) => prev + 1);
                }}
              >
                {copy.requestAskAnotherCta}
              </button>
              <a
                className="autograph-jump-link autograph-jump-link--subtle"
                href={`#${SECTION_IDS.outbox}`}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection(SECTION_IDS.outbox);
                }}
              >
                {copy.requestSentOutboxCta}
              </a>
            </div>
          </div>
        ) : null}
        <div className="autograph-form-meta">
          <p className="autograph-inline-note">
            {copy.requestMetaHint}
          </p>
          <span id="autograph-request-count" className="autograph-char-count">
            {requestMessageLength}/240
          </span>
        </div>
        {availableSigners.length > 0 ? <p className="autograph-inline-note">{copy.signerListHint}</p> : null}
        <div className="autograph-form-actions">
          <button
            type="submit"
            className="app-button-primary autograph-button-with-icon"
            disabled={!canSubmitRequest}
          >
            {isRequestSending ? (
              <span className="autograph-button-spinner" aria-hidden="true" />
            ) : (
              <DecorativeIcon name="send" className="autograph-button-icon" />
            )}
            <span>{submitLabel}</span>
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
  roleOptions: RoleOption[];
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
  roleOptions,
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
  const roleLabels = React.useMemo(() => buildRoleLabelMap(roleOptions), [roleOptions]);

  return (
    <section
      id={SECTION_IDS.inbox}
      className={`autograph-lane autograph-lane-pending autograph-tone-inbox autograph-scroll-target ${isFocused ? "is-focused-section" : ""}`}
      aria-labelledby={titleId}
    >
      <header className="autograph-lane-header">
        <div>
          <h3 id={titleId} className="autograph-lane-title autograph-title-with-icon">
            <DecorativeIcon name="inbox" className="autograph-title-icon" />
            <span>{copy.requestsForYou}</span>
          </h3>
          <p className="autograph-lane-subtitle">{copy.inboxSubtitle}</p>
        </div>
        <div className="autograph-lane-header-actions">
          {isFocused ? <SectionFocusPill label={copy.inboxFocusLabel} /> : null}
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
              <StatusPill status={item.status} copy={copy} />
            </div>
            <p className="autograph-request-pair">{rolePairLabel(item, roleLabels)}</p>
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
                aria-label={`${copy.openSigningFormLabel} ${item.requesterDisplayName}`}
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
                    placeholder={copy.signaturePlaceholder}
                    maxLength={240}
                    onChange={(event) => setSignatureDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))}
                    aria-describedby={`autograph-signature-hint-${item.id} autograph-signature-count-${item.id}`}
                  />
                  <p id={`autograph-signature-hint-${item.id}`} className="autograph-field-hint">
                    {copy.signatureHint}
                  </p>
                </label>
                <div className="autograph-suggestion-row" aria-label={copy.autographIdeasLabel}>
                  {copy.signatureIdeas.map((idea) => (
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
  roleOptions: RoleOption[];
  hasMoreArchive: boolean;
  archiveLoadingMore: boolean;
  onLoadMoreArchive: () => Promise<void>;
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
  roleOptions,
  hasMoreArchive,
  archiveLoadingMore,
  onLoadMoreArchive,
  isFocused,
  archiveFilter,
  setArchiveFilter,
  archiveSort,
  setArchiveSort,
  lastSignedRequestId,
}: ArchiveLaneProps) {
  const titleId = React.useId();
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const roleLabels = React.useMemo(() => buildRoleLabelMap(roleOptions), [roleOptions]);
  const spotlightItem = filteredArchive[0] ?? null;
  const revealItem = lastSignedRequestId
    ? filteredArchive.find((item) => item.id === lastSignedRequestId) ?? null
    : null;
  const [keepsakeStatus, setKeepsakeStatus] = React.useState<string | null>(null);
  const [downloadFormat, setDownloadFormat] = React.useState<KeepsakeDownloadFormat>("svg");

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!hasMoreArchive || archiveLoadingMore) {
      return;
    }

    const node = loadMoreRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void onLoadMoreArchive();
        }
      },
      {
        root: null,
        rootMargin: "320px 0px",
        threshold: 0,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [archiveLoadingMore, hasMoreArchive, onLoadMoreArchive, filteredArchive.length]);

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

  async function handleDownload(item: AutographRequest) {
    const safeName = `${item.requesterDisplayName}-${item.signerDisplayName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);

    const baseName = safeName || "autograph-keepsake";
    const svg = buildKeepsakeSvg(copy, item);

    try {
      const { downloadKeepsakeBlob, downloadKeepsakeText, rasterizeSvg, renderPdfFromSvg } = await import("./keepsake-export");

      if (downloadFormat === "svg") {
        downloadKeepsakeText(`${baseName}.svg`, svg);
        setKeepsakeStatus(copy.keepsakeDownloadedStatus);
        return;
      }

      if (downloadFormat === "pdf") {
        const blob = await renderPdfFromSvg(svg);
        downloadKeepsakeBlob(`${baseName}.pdf`, blob);
        setKeepsakeStatus(copy.keepsakeDownloadedStatus);
        return;
      }

      const mimeType =
        downloadFormat === "png"
          ? "image/png"
          : downloadFormat === "jpg"
            ? "image/jpeg"
            : "image/gif";

      const blob = await rasterizeSvg(svg, mimeType);
      downloadKeepsakeBlob(`${baseName}.${downloadFormat}`, blob);
      setKeepsakeStatus(copy.keepsakeDownloadedStatus);
    } catch {
      setKeepsakeStatus(copy.keepsakeUnavailableStatus);
    }
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
          <h3 id={titleId} className="autograph-lane-title autograph-title-with-icon">
            <DecorativeIcon name="archive" className="autograph-title-icon" />
            <span>{copy.signedAutographs}</span>
          </h3>
          <p className="autograph-lane-subtitle">{copy.archiveSubtitle}</p>
        </div>
        <div className="autograph-lane-header-actions">
          {isFocused ? <SectionFocusPill label={copy.archiveFocusLabel} /> : null}
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
              <button type="button" className="autograph-secondary-btn autograph-button-with-icon" onClick={() => void handleShare(revealItem)}>
                <DecorativeIcon name="share" className="autograph-button-icon" />
                <span>{copy.shareKeepsakeLabel}</span>
              </button>
              <button type="button" className="autograph-secondary-btn autograph-button-with-icon" onClick={() => void handleCopy(revealItem)}>
                <DecorativeIcon name="copy" className="autograph-button-icon" />
                <span>{copy.copyKeepsakeLabel}</span>
              </button>
              <label className="autograph-visually-hidden" htmlFor="autograph-download-format-reveal">{copy.downloadFormatLabel}</label>
              <select
                id="autograph-download-format-reveal"
                className={`${INPUT_CLASS} autograph-download-format`}
                value={downloadFormat}
                onChange={(event) => setDownloadFormat(event.target.value as KeepsakeDownloadFormat)}
                aria-label={copy.downloadFormatLabel}
              >
                <option value="svg">{copy.downloadSvgLabel}</option>
                <option value="png">{copy.downloadPngLabel}</option>
                <option value="jpg">{copy.downloadJpgLabel}</option>
                <option value="gif">{copy.downloadGifLabel}</option>
                <option value="pdf">{copy.downloadPdfLabel}</option>
              </select>
              <button type="button" className="autograph-secondary-btn autograph-button-with-icon" onClick={() => void handleDownload(revealItem)}>
                <DecorativeIcon name="download" className="autograph-button-icon" />
                <span>{copy.downloadKeepsakeLabel}</span>
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
            className={`${INPUT_CLASS} autograph-filter-input`}
            aria-label={copy.searchLabel}
            title={copy.searchPlaceholder}
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
                <StatusPill status={item.status} copy={copy} />
              </div>
              <p className="autograph-request-pair">{rolePairLabel(item, roleLabels)}</p>
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
                <button type="button" className="autograph-secondary-btn autograph-button-with-icon" onClick={() => void handleShare(item)}>
                  <DecorativeIcon name="share" className="autograph-button-icon" />
                  <span>{copy.shareKeepsakeLabel}</span>
                </button>
                <button type="button" className="autograph-secondary-btn autograph-button-with-icon" onClick={() => void handleCopy(item)}>
                  <DecorativeIcon name="copy" className="autograph-button-icon" />
                  <span>{copy.copyKeepsakeLabel}</span>
                </button>
                <label className="autograph-visually-hidden" htmlFor={`autograph-download-format-${item.id}`}>{copy.downloadFormatLabel}</label>
                <select
                  id={`autograph-download-format-${item.id}`}
                  className={`${INPUT_CLASS} autograph-download-format`}
                  value={downloadFormat}
                  onChange={(event) => setDownloadFormat(event.target.value as KeepsakeDownloadFormat)}
                  aria-label={copy.downloadFormatLabel}
                >
                  <option value="svg">{copy.downloadSvgLabel}</option>
                  <option value="png">{copy.downloadPngLabel}</option>
                  <option value="jpg">{copy.downloadJpgLabel}</option>
                  <option value="gif">{copy.downloadGifLabel}</option>
                  <option value="pdf">{copy.downloadPdfLabel}</option>
                </select>
                <button type="button" className="autograph-secondary-btn autograph-button-with-icon" onClick={() => void handleDownload(item)}>
                  <DecorativeIcon name="download" className="autograph-button-icon" />
                  <span>{copy.downloadKeepsakeLabel}</span>
                </button>
              </div>
            </article>
          );
        })
      )}
      {hasMoreArchive ? (
        <div className="autograph-load-more-wrap" ref={loadMoreRef}>
          <button
            type="button"
            className="autograph-secondary-btn"
            onClick={() => void onLoadMoreArchive()}
            disabled={archiveLoadingMore}
          >
            {archiveLoadingMore ? copy.loadingMoreKeepsakes : copy.loadMoreKeepsakes}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export interface OutboxSectionProps {
  copy: AutographExchangeCopy;
  outbox: AutographRequest[];
  roleOptions: RoleOption[];
  isFocused: boolean;
}

function OutboxSectionComponent({
  copy,
  outbox,
  roleOptions,
  isFocused,
}: OutboxSectionProps) {
  const titleId = React.useId();
  const roleLabels = React.useMemo(() => buildRoleLabelMap(roleOptions), [roleOptions]);
  return (
    <section
      id={SECTION_IDS.outbox}
      className={`autograph-outbox autograph-tone-sent autograph-scroll-target ${isFocused ? "is-focused-section" : ""}`}
      aria-labelledby={titleId}
    >
      <div className="autograph-lane-header">
        <div>
          <h3 id={titleId} className="autograph-lane-title autograph-title-with-icon">
            <DecorativeIcon name="send" className="autograph-title-icon" />
            <span>{copy.requestsSent}</span>
          </h3>
          <p className="autograph-lane-subtitle">{copy.outboxSubtitle}</p>
        </div>
        <div className="autograph-lane-header-actions">
          {isFocused ? <SectionFocusPill label={copy.outboxFocusLabel} /> : null}
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
                <StatusPill status={item.status} copy={copy} />
              </div>
              <p className="autograph-request-pair">{rolePairLabel(item, roleLabels)}</p>
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
