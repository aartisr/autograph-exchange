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
import { formatRelativeDate, INPUT_CLASS, REQUEST_PROMPTS, rolePairLabel, SIGNATURE_IDEAS, titleCaseRole } from "./screen-utils";

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

export interface HeroSectionProps {
  copy: AutographExchangeCopy;
  nextAction: string;
  outboxCount: number;
  inboxCount: number;
  archiveCount: number;
}

export function HeroSection({
  copy,
  nextAction,
  outboxCount,
  inboxCount,
  archiveCount,
}: HeroSectionProps) {
  const titleId = React.useId();

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
        <article className="autograph-stat autograph-stat-sent autograph-tone-sent">
          <span className="autograph-stat-label">{copy.requestsSent}</span>
          <span className="autograph-stat-value">{outboxCount}</span>
        </article>
        <article className="autograph-stat autograph-stat-inbox autograph-tone-inbox">
          <span className="autograph-stat-label">{copy.requestsForYou}</span>
          <span className="autograph-stat-value">{inboxCount}</span>
        </article>
        <article className="autograph-stat autograph-stat-archive autograph-tone-archive">
          <span className="autograph-stat-label">{copy.signedAutographs}</span>
          <span className="autograph-stat-value">{archiveCount}</span>
        </article>
      </div>
      <div className="autograph-quick-steps" aria-label="How autograph exchange works">
        <QuickStep step="1" title={copy.stepOneTitle} detail={copy.stepOneDetail} />
        <QuickStep step="2" title={copy.stepTwoTitle} detail={copy.stepTwoDetail} />
        <QuickStep step="3" title={copy.stepThreeTitle} detail={copy.stepThreeDetail} />
      </div>
    </section>
  );
}

export interface ProfileSectionProps {
  copy: AutographExchangeCopy;
  hasProfile: boolean;
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
    <section className="app-surface-card autograph-setup-card autograph-section-card" aria-labelledby={titleId}>
      <header className="autograph-section-header">
        <p className="autograph-section-step">{copy.stepOne}</p>
        <div className="autograph-section-heading">
          <div>
            <h3 id={titleId} className="autograph-section-title">
              Your autograph profile
            </h3>
            <p className="app-copy-soft autograph-section-copy">Set your display name and role once so people can ask you for an autograph.</p>
          </div>
          <span className={`autograph-setup-badge ${hasProfile ? "is-ready" : ""}`}>
            {hasProfile ? copy.stepReady : copy.stepNeededOnce}
          </span>
        </div>
      </header>
      {hasProfile && !isEditingProfile ? (
        <div className="autograph-context-panel">
          <p className="autograph-context-label">{copy.signedInIdentityLabel}</p>
          <p className="autograph-context-detail">{sessionIdentity}</p>
          <p className="autograph-context-label">{copy.savedProfile}</p>
          <p className="autograph-context-title">
            {effectiveProfileName} · {titleCaseRole(effectiveProfileRole)}
          </p>
          <p className="autograph-context-detail">{copy.savedProfileHint}</p>
          <p className="autograph-inline-note">{copy.signedInIdentityHint}</p>
          <div className="autograph-request-actions start">
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
    <section className="app-surface-card autograph-setup-card autograph-section-card" aria-labelledby={titleId}>
      <header className="autograph-section-header">
        <p className="autograph-section-step">{copy.stepTwo}</p>
        <div className="autograph-section-heading">
          <div>
            <h3 id={titleId} className="autograph-section-title">
              Ask someone for an autograph
            </h3>
            <p className="app-copy-soft autograph-section-copy">{copy.requestExplainer}</p>
          </div>
          <span className={`autograph-setup-badge ${hasProfile ? "is-ready" : ""}`}>
            {hasProfile ? copy.stepCanAsk : copy.stepCompleteFirst}
          </span>
        </div>
      </header>
      <form className="autograph-form-grid autograph-composer-grid" onSubmit={onRequestSubmit}>
        <label className="autograph-field">
          <span className="app-form-label">{copy.whoShouldSign}</span>
          <select
            className={INPUT_CLASS}
            value={requestForm.signerUserId}
            onChange={(event) => setRequestForm((prev) => ({ ...prev, signerUserId: event.target.value }))}
            required
            aria-describedby={signerHintId}
          >
            <option value="">Choose one person</option>
            {availableSigners.map((profile) => (
              <option key={profile.userId} value={profile.userId}>
                {profile.displayName} ({titleCaseRole(profile.role)})
              </option>
            ))}
          </select>
          <p id={signerHintId} className="autograph-field-hint">
            Start with one person so your request feels direct and thoughtful.
          </p>
        </label>
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
    <section className="autograph-lane autograph-lane-pending autograph-tone-inbox" aria-labelledby={titleId}>
      <header className="autograph-lane-header">
        <div>
          <h3 id={titleId} className="autograph-lane-title">
            {copy.requestsForYou}
          </h3>
          <p className="autograph-lane-subtitle">{copy.inboxSubtitle}</p>
        </div>
        <p className="autograph-lane-meta">
          {inbox.length} {copy.waitingCountSuffix}
        </p>
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
  archiveFilter: string;
  setArchiveFilter: React.Dispatch<React.SetStateAction<string>>;
  archiveSort: ArchiveSort;
  setArchiveSort: React.Dispatch<React.SetStateAction<ArchiveSort>>;
  lastSignedRequestId: string | null;
}

export function ArchiveLane({
  copy,
  filteredArchive,
  archiveFilter,
  setArchiveFilter,
  archiveSort,
  setArchiveSort,
  lastSignedRequestId,
}: ArchiveLaneProps) {
  const titleId = React.useId();
  return (
    <section className="autograph-lane autograph-lane-archive autograph-tone-archive" aria-labelledby={titleId}>
      <header className="autograph-lane-header">
        <div>
          <h3 id={titleId} className="autograph-lane-title">
            {copy.signedAutographs}
          </h3>
          <p className="autograph-lane-subtitle">{copy.archiveSubtitle}</p>
        </div>
        <p className="autograph-lane-meta">
          {filteredArchive.length} {copy.totalCountSuffix}
        </p>
      </header>
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
        filteredArchive.map((item) => (
          <article
            key={item.id}
            className={`autograph-archive-card ${lastSignedRequestId === item.id ? "is-highlight" : ""}`}
            data-testid="signed-request-card"
          >
            <div className="autograph-request-card-header">
              <p className="autograph-card-title">
                {item.requesterDisplayName} ↔ {item.signerDisplayName}
              </p>
              <StatusPill status={item.status} />
            </div>
            <p className="autograph-request-pair">{rolePairLabel(item)}</p>
            <p className="autograph-archive-message app-copy-soft">{item.message}</p>
            <blockquote className="autograph-signature-quote">“{item.signatureText}”</blockquote>
            <p className="autograph-request-time">
              {copy.signedPrefix} {formatRelativeDate(item.signedAt ?? item.createdAt, copy)}
            </p>
          </article>
        ))
      )}
    </section>
  );
}

export interface OutboxSectionProps {
  copy: AutographExchangeCopy;
  outbox: AutographRequest[];
}

export function OutboxSection({
  copy,
  outbox,
}: OutboxSectionProps) {
  const titleId = React.useId();
  return (
    <section className="autograph-outbox autograph-tone-sent" aria-labelledby={titleId}>
      <div className="autograph-lane-header">
        <div>
          <h3 id={titleId} className="autograph-lane-title">
            {copy.requestsSent}
          </h3>
          <p className="autograph-lane-subtitle">{copy.outboxSubtitle}</p>
        </div>
        <p className="autograph-lane-meta">
          {outbox.length} {copy.pendingCountSuffix}
        </p>
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
