"use client";

import React from "react";
import type { AutographProfile, AutographRole, PublicAutographProfile } from "./types";
import { INPUT_CLASS, titleCaseRole } from "./screen-utils";
import { ProfilePhotoInput } from "./profile-photo-input";
import { EnlargableProfilePhoto } from "./profile-photo-lightbox";

type ViewerProfile = {
  id: string;
  email?: string | null;
};

type EditableProfileForm = {
  id?: string;
  userId: string;
  displayName: string;
  role: AutographRole;
  headline: string;
  bio: string;
  avatarUrl: string;
  affiliation: string;
  location: string;
  subjects: string;
  interests: string;
  signaturePrompt: string;
};

type ProfileNavigationProps = {
  currentLabel: string;
  includeProfilesLink?: boolean;
  exchangeHomeHref?: string;
  exchangeReturnHref?: string;
  profilesHref?: string;
};

const DEFAULT_EXCHANGE_HOME_HREF = "/";
const DEFAULT_EXCHANGE_RETURN_HREF = "/#autograph-request-composer";
const DEFAULT_PROFILE_SETUP_HREF = "/#autograph-profile-setup";
const DEFAULT_PROFILES_HREF = "/profiles";
const DEFAULT_OUTBOX_HREF = "/#autograph-requests-sent";

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function joinTags(value: string[] | undefined): string {
  return (value ?? []).join(", ");
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "A").concat(parts[1]?.[0] ?? "").toUpperCase();
}

function firstNameFor(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean)[0] ?? name;
}

function formatProfileDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently updated";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function profileToForm(profile?: AutographProfile): EditableProfileForm {
  return {
    id: profile?.id,
    userId: profile?.userId ?? "",
    displayName: profile?.displayName ?? "",
    role: profile?.role ?? "student",
    headline: profile?.headline ?? "",
    bio: profile?.bio ?? "",
    avatarUrl: profile?.avatarUrl ?? "",
    affiliation: profile?.affiliation ?? "",
    location: profile?.location ?? "",
    subjects: joinTags(profile?.subjects),
    interests: joinTags(profile?.interests),
    signaturePrompt: profile?.signaturePrompt ?? "",
  };
}

function formToPayload(form: EditableProfileForm) {
  return {
    userId: form.userId,
    displayName: form.displayName,
    role: form.role,
    headline: form.headline,
    bio: form.bio,
    avatarUrl: form.avatarUrl,
    affiliation: form.affiliation,
    location: form.location,
    subjects: splitTags(form.subjects),
    interests: splitTags(form.interests),
    signaturePrompt: form.signaturePrompt,
  };
}

function formToPreviewProfile(form: EditableProfileForm): PublicAutographProfile {
  const displayName = form.displayName.trim() || "New profile";
  const subjects = splitTags(form.subjects);
  const interests = splitTags(form.interests);
  const headline = form.headline.trim();
  const bio = form.bio.trim();
  const signaturePrompt = form.signaturePrompt.trim();

  return {
    id: form.id ?? "profile-preview",
    displayName,
    role: form.role,
    headline: headline || (form.role === "teacher" ? "Teacher profile" : "Student profile"),
    bio: bio || "A short bio will help people understand what to ask for and why this profile matters.",
    avatarUrl: form.avatarUrl || undefined,
    affiliation: form.affiliation.trim() || undefined,
    location: form.location.trim() || undefined,
    subjects,
    interests,
    signaturePrompt: signaturePrompt || "Ask for a memory, encouragement, or blessing to keep.",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function profileReadiness(form: EditableProfileForm): { completed: number; total: number; label: string } {
  const checks = [
    form.userId.trim(),
    form.displayName.trim(),
    form.headline.trim(),
    form.bio.trim(),
    form.avatarUrl.trim(),
    form.subjects.trim() || form.interests.trim(),
    form.signaturePrompt.trim(),
  ];
  const completed = checks.filter(Boolean).length;
  const total = checks.length;

  return {
    completed,
    total,
    label: completed >= total - 1 ? "Polished" : completed >= 4 ? "Nearly ready" : "Draft",
  };
}

function ProfileAvatar({ profile, size = "large" }: { profile: PublicAutographProfile; size?: "small" | "large" }) {
  const className = `autograph-profile-avatar autograph-profile-avatar-${size}`;

  if (profile.avatarUrl) {
    return (
      <EnlargableProfilePhoto
        src={profile.avatarUrl}
        alt={`${profile.displayName} profile`}
        imageClassName={className}
        dialogTitle={`${profile.displayName} profile photo`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span className={className} aria-hidden="true">
      {initialsFor(profile.displayName)}
    </span>
  );
}

function TagList({ label, tags }: { label: string; tags?: string[] }) {
  if (!tags?.length) {
    return null;
  }

  return (
    <div className="autograph-profile-tags" aria-label={label}>
      {tags.map((tag) => (
        <span key={tag} className="autograph-profile-tag">
          {tag}
        </span>
      ))}
    </div>
  );
}

function ProfileMeta({ profile }: { profile: PublicAutographProfile }) {
  const details = [profile.affiliation, profile.location].filter(Boolean);

  if (details.length === 0) {
    return null;
  }

  return <p className="autograph-profile-meta">{details.join(" · ")}</p>;
}

function AdminProfilePreview({ form, isEditing }: { form: EditableProfileForm; isEditing: boolean }) {
  const preview = formToPreviewProfile(form);
  const readiness = profileReadiness(form);
  const readinessPercent = Math.round((readiness.completed / readiness.total) * 100);
  const combinedTags = [...(preview.subjects ?? []), ...(preview.interests ?? [])].slice(0, 6);

  return (
    <article className="app-surface-card autograph-admin-preview" aria-label="Public profile preview">
      <div className="autograph-admin-preview-topline">
        <p className="autograph-context-label">Public profile</p>
        <span className="autograph-admin-readiness-chip">{readiness.label}</span>
      </div>
      <div className="autograph-admin-preview-identity">
        <ProfileAvatar profile={preview} size="large" />
        <div className="autograph-admin-preview-copy">
          <p className="autograph-role-chip">{titleCaseRole(preview.role)}</p>
          <h3 className="autograph-admin-preview-name">{preview.displayName}</h3>
          <ProfileMeta profile={preview} />
        </div>
      </div>
      <div className="autograph-admin-readiness" aria-label={`Profile readiness ${readiness.completed} of ${readiness.total}`}>
        <span className="autograph-admin-readiness-bar">
          <span style={{ width: `${readinessPercent}%` }} />
        </span>
        <span>{readiness.completed}/{readiness.total}</span>
      </div>
      <p className="autograph-profile-card-headline">{preview.headline}</p>
      <p className="autograph-profile-bio">{preview.bio}</p>
      <TagList label="Profile preview topics" tags={combinedTags} />
      <p className="autograph-profile-prompt">{preview.signaturePrompt}</p>
      {isEditing && form.id ? (
        <div className="autograph-request-actions start">
          <a className="autograph-jump-link autograph-jump-link--subtle" href={`/profiles/${encodeURIComponent(form.id)}`}>
            Open public page
          </a>
        </div>
      ) : null}
    </article>
  );
}

function ProfileNavigation({
  currentLabel,
  includeProfilesLink = false,
  exchangeHomeHref = DEFAULT_EXCHANGE_HOME_HREF,
  exchangeReturnHref = DEFAULT_EXCHANGE_RETURN_HREF,
  profilesHref = DEFAULT_PROFILES_HREF,
}: ProfileNavigationProps) {
  const contextLabel = includeProfilesLink ? "Profile page" : "Profile directory";

  return (
    <nav className="autograph-profile-nav" aria-label="Profile navigation">
      <div className="autograph-profile-nav-main">
        <span className="autograph-profile-nav-mark" aria-hidden="true">
          AE
        </span>
        <div className="autograph-profile-nav-copy">
          <p className="autograph-profile-nav-label">{contextLabel}</p>
          <ol className="autograph-profile-breadcrumbs">
            <li>
              <a href={exchangeHomeHref}>Autograph Exchange</a>
            </li>
            {includeProfilesLink ? (
              <li>
                <a href={profilesHref}>Profiles</a>
              </li>
            ) : null}
            <li aria-current="page">{currentLabel}</li>
          </ol>
        </div>
      </div>
      <div className="autograph-profile-nav-actions">
        <a className="autograph-profile-return-link" href={exchangeReturnHref}>
          Back to autograph screen
        </a>
      </div>
    </nav>
  );
}

function ProfileDetailCard({
  label,
  title,
  children,
  tone = "default",
}: {
  label: string;
  title: string;
  children: React.ReactNode;
  tone?: "default" | "accent";
}) {
  return (
    <article className={`app-surface-card autograph-profile-detail-card ${tone === "accent" ? "is-accent" : ""}`}>
      <p className="autograph-context-label">{label}</p>
      <h3 className="autograph-profile-detail-title">{title}</h3>
      <div className="autograph-profile-detail-body">{children}</div>
    </article>
  );
}

function ProfileSnapshot({ profile }: { profile: PublicAutographProfile }) {
  const subjects = profile.subjects ?? [];
  const interests = profile.interests ?? [];
  const items = [
    { label: "Role", value: titleCaseRole(profile.role) },
    { label: "Affiliation", value: profile.affiliation ?? "Community member" },
    { label: "Location", value: profile.location ?? "Shared online" },
    { label: "Focus", value: countLabel(subjects.length, "area", "areas") },
    { label: "Interests", value: countLabel(interests.length, "interest", "interests") },
    { label: "Updated", value: formatProfileDate(profile.updatedAt) },
  ];

  return (
    <article className="app-surface-card autograph-profile-side-card">
      <p className="autograph-context-label">Profile snapshot</p>
      <dl className="autograph-profile-snapshot-list">
        {items.map((item) => (
          <div key={item.label} className="autograph-profile-snapshot-row">
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function ProfileHighlightGrid({ profile }: { profile: PublicAutographProfile }) {
  const subjects = profile.subjects ?? [];
  const interests = profile.interests ?? [];
  const items = [
    { label: "Role", value: titleCaseRole(profile.role) },
    { label: "Focus", value: countLabel(subjects.length, "area", "areas") },
    { label: "Interests", value: countLabel(interests.length, "interest", "interests") },
    { label: "Updated", value: formatProfileDate(profile.updatedAt) },
  ];

  return (
    <dl className="autograph-profile-highlight-grid" aria-label={`${profile.displayName} profile highlights`}>
      {items.map((item) => (
        <div key={item.label} className="autograph-profile-highlight">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AutographProfileDirectory({
  profiles,
  title = "People you can ask",
  subtitle = "Browse teachers, students, and community members, then open a profile to request a meaningful autograph.",
  exchangeHomeHref = DEFAULT_EXCHANGE_HOME_HREF,
  exchangeReturnHref = DEFAULT_EXCHANGE_RETURN_HREF,
  profilesHref = DEFAULT_PROFILES_HREF,
}: {
  profiles: PublicAutographProfile[];
  title?: string;
  subtitle?: string;
  exchangeHomeHref?: string;
  exchangeReturnHref?: string;
  profilesHref?: string;
}) {
  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"all" | AutographRole>("all");
  const normalized = query.trim().toLowerCase();

  const filteredProfiles = profiles.filter((profile) => {
    const matchesRole = roleFilter === "all" || profile.role === roleFilter;
    const haystack = [
      profile.displayName,
      profile.headline,
      profile.bio,
      profile.affiliation,
      profile.location,
      ...(profile.subjects ?? []),
      ...(profile.interests ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return matchesRole && (!normalized || haystack.includes(normalized));
  });

  return (
    <section className="autograph-shell autograph-profile-directory">
      <ProfileNavigation
        currentLabel="Profiles"
        exchangeHomeHref={exchangeHomeHref}
        exchangeReturnHref={exchangeReturnHref}
        profilesHref={profilesHref}
      />

      <header className="autograph-profile-page-header">
        <p className="autograph-hero-kicker">Profile directory</p>
        <h2 className="autograph-hero-title">{title}</h2>
        <p className="autograph-hero-description">{subtitle}</p>
      </header>

      <div className="autograph-profile-toolbar">
        <label className="autograph-field">
          <span className="app-form-label">Search profiles</span>
          <input
            className={INPUT_CLASS}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, subject, group, or interest"
          />
        </label>
        <label className="autograph-field">
          <span className="app-form-label">Role</span>
          <select
            className={INPUT_CLASS}
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as "all" | AutographRole)}
          >
            <option value="all">All roles</option>
            <option value="teacher">Teachers</option>
            <option value="student">Students</option>
          </select>
        </label>
      </div>

      <div className="autograph-profile-grid-list">
        {filteredProfiles.map((profile) => (
          <article key={profile.id} className="autograph-profile-card">
            <div className="autograph-profile-card-top">
              <ProfileAvatar profile={profile} size="small" />
              <div>
                <h3 className="autograph-profile-card-name">{profile.displayName}</h3>
                <p className="autograph-role-chip">{titleCaseRole(profile.role)}</p>
              </div>
            </div>
            <p className="autograph-profile-card-headline">{profile.headline || "Ready to share a thoughtful autograph."}</p>
            <ProfileMeta profile={profile} />
            <TagList label={`${profile.displayName} subjects`} tags={profile.subjects} />
            <a
              className="autograph-profile-card-link"
              href={`${profilesHref.replace(/\/$/, "")}/${encodeURIComponent(profile.id)}`}
            >
              View profile
            </a>
          </article>
        ))}
      </div>

      {filteredProfiles.length === 0 ? (
        <p className="app-copy-soft autograph-empty">No profiles match that search yet.</p>
      ) : null}
    </section>
  );
}

export function AutographProfileRequestPanel({
  profile,
  viewer,
  viewerHasProfile = false,
  requestEndpoint = "/api/autographs/requests",
  signInHref = "/sign-in",
  profileSetupHref = DEFAULT_PROFILE_SETUP_HREF,
  exchangeReturnHref = DEFAULT_EXCHANGE_RETURN_HREF,
  outboxHref = DEFAULT_OUTBOX_HREF,
}: {
  profile: PublicAutographProfile;
  viewer: ViewerProfile | null;
  viewerHasProfile?: boolean;
  requestEndpoint?: string;
  signInHref?: string;
  profileSetupHref?: string;
  exchangeReturnHref?: string;
  outboxHref?: string;
}) {
  const defaultMessage =
    profile.signaturePrompt?.trim()
    || `Could you share a favorite memory, encouragement, or blessing for me to keep?`;
  const [message, setMessage] = React.useState(defaultMessage);
  const [status, setStatus] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSending, setIsSending] = React.useState(false);
  const messageLength = message.trim().length;

  if (!viewer) {
    return (
      <div className="autograph-profile-action-card autograph-profile-request-card">
        <div>
          <p className="autograph-context-label">Request an autograph</p>
          <h3 className="autograph-profile-action-title">Ask {firstNameFor(profile.displayName)}</h3>
          <p className="autograph-context-detail">Sign in to ask {profile.displayName} for an autograph from this profile.</p>
        </div>
        <a className="app-button-primary autograph-profile-primary-link" href={signInHref}>
          Sign in to request
        </a>
      </div>
    );
  }

  if (!viewerHasProfile) {
    return (
      <div className="autograph-profile-action-card autograph-profile-request-card">
        <div>
          <p className="autograph-context-label">Request an autograph</p>
          <h3 className="autograph-profile-action-title">Save your profile first</h3>
          <p className="autograph-context-detail">
            Create your own display name and role once, then come back to ask {profile.displayName}.
          </p>
        </div>
        <a className="app-button-primary autograph-profile-primary-link" href={profileSetupHref}>
          Save my profile
        </a>
      </div>
    );
  }

  return (
    <form
      className="autograph-profile-action-card autograph-profile-request-card"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSending(true);
        setStatus(null);
        setError(null);

        try {
          const response = await fetch(requestEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              signerProfileId: profile.id,
              message,
            }),
          });

          if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            throw new Error(payload?.error ?? "Unable to send autograph request.");
          }

          setMessage("");
          setStatus(`Request sent to ${profile.displayName}.`);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unable to send autograph request.");
        } finally {
          setIsSending(false);
        }
      }}
    >
      <div>
        <p className="autograph-context-label">Request an autograph</p>
        <h3 className="autograph-profile-action-title">Ask {firstNameFor(profile.displayName)}</h3>
      </div>
      <label className="autograph-field">
        <span className="app-form-label">Message</span>
        <textarea
          className={INPUT_CLASS}
          rows={4}
          value={message}
          maxLength={240}
          required
          onChange={(event) => setMessage(event.target.value)}
          placeholder={`Ask ${profile.displayName} for a message you will want to remember.`}
        />
      </label>
      <div className="autograph-form-meta">
        <p className="autograph-inline-note">Keep it specific and personal.</p>
        <span className="autograph-char-count">{messageLength}/240</span>
      </div>
      <button className="app-button-primary autograph-button-fill" type="submit" disabled={isSending || !message.trim()}>
        {isSending ? "Sending..." : `Ask ${profile.displayName}`}
      </button>
      {status ? (
        <div className="autograph-profile-success">
          <p className="autograph-status-banner">{status}</p>
          <div className="autograph-feedback-actions">
            <a className="autograph-jump-link autograph-jump-link--subtle" href={outboxHref}>
              View sent requests
            </a>
            <a className="autograph-jump-link autograph-jump-link--subtle" href={exchangeReturnHref}>
              Back to autograph screen
            </a>
          </div>
        </div>
      ) : null}
      {error ? <p className="app-alert-error autograph-error-banner">{error}</p> : null}
    </form>
  );
}

export function AutographProfileShowcase({
  profile,
  viewer,
  canEdit = false,
  viewerHasProfile = false,
  exchangeHomeHref = DEFAULT_EXCHANGE_HOME_HREF,
  exchangeReturnHref = DEFAULT_EXCHANGE_RETURN_HREF,
  profilesHref = DEFAULT_PROFILES_HREF,
  profileSetupHref = DEFAULT_PROFILE_SETUP_HREF,
  outboxHref = DEFAULT_OUTBOX_HREF,
}: {
  profile: PublicAutographProfile;
  viewer: ViewerProfile | null;
  canEdit?: boolean;
  viewerHasProfile?: boolean;
  exchangeHomeHref?: string;
  exchangeReturnHref?: string;
  profilesHref?: string;
  profileSetupHref?: string;
  outboxHref?: string;
}) {
  const titleId = React.useId();
  const subjects = profile.subjects ?? [];
  const interests = profile.interests ?? [];
  const heroTags = [...subjects, ...interests].slice(0, 6);
  const prompt = profile.signaturePrompt || `Ask ${profile.displayName} for a favorite memory, encouragement, or blessing.`;

  return (
    <section className="autograph-shell autograph-profile-showcase" aria-labelledby={titleId}>
      <ProfileNavigation
        currentLabel={profile.displayName}
        includeProfilesLink
        exchangeHomeHref={exchangeHomeHref}
        exchangeReturnHref={exchangeReturnHref}
        profilesHref={profilesHref}
      />

      <div className="autograph-profile-hero-grid">
        <article className="autograph-profile-identity-card">
          <div className="autograph-profile-hero-main">
            <ProfileAvatar profile={profile} />
            <div className="autograph-profile-identity">
              <p className="autograph-hero-kicker">{titleCaseRole(profile.role)} profile</p>
              <h2 id={titleId} className="autograph-profile-name">
                {profile.displayName}
              </h2>
              <p className="autograph-profile-headline">{profile.headline || "Thoughtful autograph exchange participant"}</p>
              <ProfileMeta profile={profile} />
              <TagList label={`${profile.displayName} profile highlights`} tags={heroTags} />
              <div className="autograph-profile-hero-actions">
                <a className="autograph-secondary-btn" href={profilesHref}>
                  Browse profiles
                </a>
                {canEdit ? (
                  <a className="autograph-secondary-btn" href={profileSetupHref}>
                    Edit my profile
                  </a>
                ) : null}
              </div>
            </div>
          </div>
          <ProfileHighlightGrid profile={profile} />
        </article>

        {canEdit ? (
          <div className="autograph-profile-action-card autograph-profile-request-card">
            <div>
              <p className="autograph-context-label">Your public profile</p>
              <h3 className="autograph-profile-action-title">Ready for requests</h3>
              <p className="autograph-context-detail">
                This is how other people see you before they ask for your autograph.
              </p>
            </div>
            <a className="app-button-primary autograph-profile-primary-link" href={profileSetupHref}>
              Edit my profile
            </a>
          </div>
        ) : (
          <AutographProfileRequestPanel
            profile={profile}
            viewer={viewer}
            viewerHasProfile={viewerHasProfile}
            profileSetupHref={profileSetupHref}
            exchangeReturnHref={exchangeReturnHref}
            outboxHref={outboxHref}
          />
        )}
      </div>

      <div className="autograph-profile-content-layout">
        <div className="autograph-profile-main-column">
          <ProfileDetailCard label="About" title={`Meet ${firstNameFor(profile.displayName)}`}>
            <p className="autograph-profile-bio">{profile.bio || "This profile is ready for a short introduction."}</p>
          </ProfileDetailCard>

          <ProfileDetailCard label="Autograph prompt" title="A good place to begin" tone="accent">
            <blockquote className="autograph-profile-prompt">
              {prompt}
            </blockquote>
          </ProfileDetailCard>

          <div className="autograph-profile-detail-grid">
            <ProfileDetailCard label="Focus areas" title="What they share">
              <TagList label={`${profile.displayName} focus areas`} tags={subjects} />
              {!subjects.length ? <p className="app-copy-soft">No focus areas added yet.</p> : null}
            </ProfileDetailCard>
            <ProfileDetailCard label="Interests" title="What they care about">
              <TagList label={`${profile.displayName} interests`} tags={interests} />
              {!interests.length ? <p className="app-copy-soft">No interests added yet.</p> : null}
            </ProfileDetailCard>
          </div>
        </div>

        <aside className="autograph-profile-side-column" aria-label={`${profile.displayName} profile summary`}>
          <ProfileSnapshot profile={profile} />
          <article className="app-surface-card autograph-profile-side-card">
            <p className="autograph-context-label">Request tone</p>
            <p className="autograph-profile-bio">
              {subjects.length || interests.length
                ? `A thoughtful note can connect to ${[...subjects, ...interests].slice(0, 3).join(", ")}.`
                : "A thoughtful note can mention a memory, a lesson, or a next step."}
            </p>
          </article>
        </aside>
      </div>
    </section>
  );
}

function ProfileFormFields({
  form,
  setForm,
  includeUserId,
}: {
  form: EditableProfileForm;
  setForm: React.Dispatch<React.SetStateAction<EditableProfileForm>>;
  includeUserId: boolean;
}) {
  return (
    <div className="autograph-admin-form-grid">
      <fieldset className="autograph-admin-fieldset">
        <legend>
          <span className="autograph-admin-fieldset-kicker">Identity</span>
          <span className="autograph-admin-fieldset-title">Who this profile belongs to</span>
        </legend>
        <div className="autograph-admin-fields">
          {includeUserId ? (
            <label className="autograph-field">
              <span className="app-form-label">User ID or email</span>
              <input
                className={INPUT_CLASS}
                value={form.userId}
                required
                onChange={(event) => setForm((prev) => ({ ...prev, userId: event.target.value }))}
                placeholder="teacher@example.com"
              />
            </label>
          ) : null}
          <label className="autograph-field">
            <span className="app-form-label">Display name</span>
            <input
              className={INPUT_CLASS}
              value={form.displayName}
              required
              onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
              placeholder="Asha Raman"
            />
          </label>
          <label className="autograph-field">
            <span className="app-form-label">Role</span>
            <select className={INPUT_CLASS} value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as AutographRole }))}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </label>
          <label className="autograph-field">
            <span className="app-form-label">Affiliation</span>
            <input
              className={INPUT_CLASS}
              value={form.affiliation}
              onChange={(event) => setForm((prev) => ({ ...prev, affiliation: event.target.value }))}
              placeholder="Forever Lotus"
            />
          </label>
          <label className="autograph-field">
            <span className="app-form-label">Location</span>
            <input
              className={INPUT_CLASS}
              value={form.location}
              onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
              placeholder="Online"
            />
          </label>
          <ProfilePhotoInput
            value={form.avatarUrl}
            onChange={(avatarUrl) => setForm((prev) => ({ ...prev, avatarUrl }))}
          />
        </div>
      </fieldset>

      <fieldset className="autograph-admin-fieldset">
        <legend>
          <span className="autograph-admin-fieldset-kicker">Story</span>
          <span className="autograph-admin-fieldset-title">What others should understand</span>
        </legend>
        <div className="autograph-admin-fields">
          <label className="autograph-field autograph-admin-wide">
            <span className="app-form-label">Headline</span>
            <input
              className={INPUT_CLASS}
              value={form.headline}
              maxLength={120}
              onChange={(event) => setForm((prev) => ({ ...prev, headline: event.target.value }))}
              placeholder="Teacher and community mentor"
            />
          </label>
          <label className="autograph-field autograph-admin-wide">
            <span className="app-form-label">Bio</span>
            <textarea
              className={INPUT_CLASS}
              rows={4}
              maxLength={500}
              value={form.bio}
              onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
              placeholder="Share the context people should know before requesting an autograph."
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="autograph-admin-fieldset">
        <legend>
          <span className="autograph-admin-fieldset-kicker">Discovery</span>
          <span className="autograph-admin-fieldset-title">How people find the right note to ask for</span>
        </legend>
        <div className="autograph-admin-fields">
          <label className="autograph-field">
            <span className="app-form-label">Subjects or focus areas</span>
            <input
              className={INPUT_CLASS}
              value={form.subjects}
              onChange={(event) => setForm((prev) => ({ ...prev, subjects: event.target.value }))}
              placeholder="Math, Music, Mentorship"
            />
          </label>
          <label className="autograph-field">
            <span className="app-form-label">Interests</span>
            <input
              className={INPUT_CLASS}
              value={form.interests}
              onChange={(event) => setForm((prev) => ({ ...prev, interests: event.target.value }))}
              placeholder="Robotics, Poetry, Service"
            />
          </label>
          <label className="autograph-field autograph-admin-wide">
            <span className="app-form-label">Autograph prompt</span>
            <input
              className={INPUT_CLASS}
              value={form.signaturePrompt}
              maxLength={180}
              onChange={(event) => setForm((prev) => ({ ...prev, signaturePrompt: event.target.value }))}
              placeholder="Ask me for one memory or blessing for your next step."
            />
          </label>
        </div>
      </fieldset>
    </div>
  );
}

function ProfileDeleteDialog({
  profile,
  confirmationValue,
  isDeleting,
  onConfirmationChange,
  onCancel,
  onConfirm,
}: {
  profile: AutographProfile;
  confirmationValue: string;
  isDeleting: boolean;
  onConfirmationChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const expectedValue = profile.displayName.trim();
  const canDelete = confirmationValue.trim() === expectedValue;

  function trapDialogFocus(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Tab") {
      return;
    }

    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    );

    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="autograph-confirmation-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onCancel();
        }
      }}
    >
      <form
        className="autograph-confirmation-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="autograph-delete-profile-title"
        aria-describedby="autograph-delete-profile-description"
        onSubmit={onConfirm}
        onKeyDown={trapDialogFocus}
      >
        <div className="autograph-confirmation-header">
          <p className="autograph-context-label">Destructive action</p>
          <h3 id="autograph-delete-profile-title">Delete {profile.displayName}?</h3>
        </div>
        <p id="autograph-delete-profile-description" className="app-copy-soft">
          This removes the profile from the public directory and future signer lists. Existing autograph requests keep
          their history, names, and messages.
        </p>
        <label className="autograph-field">
          <span className="app-form-label">Type the display name to confirm</span>
          <input
            className={INPUT_CLASS}
            value={confirmationValue}
            onChange={(event) => onConfirmationChange(event.target.value)}
            placeholder={expectedValue}
            autoFocus
            disabled={isDeleting}
          />
        </label>
        <div className="autograph-confirmation-actions">
          <button type="button" className="autograph-secondary-btn" onClick={onCancel} disabled={isDeleting}>
            Keep profile
          </button>
          <button type="submit" className="autograph-danger-btn" disabled={!canDelete || isDeleting}>
            {isDeleting ? "Deleting..." : "Delete profile"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function AutographProfileAdminPanel({
  initialProfiles,
  listEndpoint = "/api/autographs/admin/profiles",
}: {
  initialProfiles: AutographProfile[];
  listEndpoint?: string;
}) {
  const [profiles, setProfiles] = React.useState(initialProfiles);
  const [form, setForm] = React.useState<EditableProfileForm>(() => profileToForm());
  const [status, setStatus] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [loadingProfileId, setLoadingProfileId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AutographProfile | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState("");
  const [deletingProfileId, setDeletingProfileId] = React.useState<string | null>(null);
  const [profileQuery, setProfileQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"all" | AutographRole>("all");
  const isEditing = Boolean(form.id);
  const filteredProfiles = React.useMemo(() => {
    const query = profileQuery.trim().toLowerCase();

    return profiles.filter((profile) => {
      const matchesRole = roleFilter === "all" || profile.role === roleFilter;
      const haystack = [
        profile.displayName,
        profile.userId,
        profile.headline,
        profile.affiliation,
        profile.location,
        ...(profile.subjects ?? []),
        ...(profile.interests ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesRole && (!query || haystack.includes(query));
    });
  }, [profileQuery, profiles, roleFilter]);

  React.useEffect(() => {
    if (!deleteTarget) {
      return undefined;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !deletingProfileId) {
        setDeleteTarget(null);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [deleteTarget, deletingProfileId]);

  async function editProfile(profile: AutographProfile) {
    setLoadingProfileId(profile.id);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch(`${listEndpoint}/${encodeURIComponent(profile.id)}`, {
        credentials: "same-origin",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to load editable profile.");
      }

      const editableProfile = (await response.json()) as AutographProfile;
      setForm(profileToForm(editableProfile));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load editable profile.");
    } finally {
      setLoadingProfileId(null);
    }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatus(null);
    setError(null);

    try {
      const endpoint = isEditing ? `${listEndpoint}/${encodeURIComponent(form.id as string)}` : listEndpoint;
      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(formToPayload(form)),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to save profile.");
      }

      const saved = (await response.json()) as AutographProfile;
      setProfiles((prev) => [saved, ...prev.filter((profile) => profile.id !== saved.id)].sort((a, b) => a.displayName.localeCompare(b.displayName)));
      setForm(profileToForm());
      setStatus(`Saved ${saved.displayName}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!deleteTarget) {
      return;
    }

    if (deleteConfirmation.trim() !== deleteTarget.displayName.trim()) {
      setError("Type the profile display name to confirm deletion.");
      return;
    }

    setDeletingProfileId(deleteTarget.id);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch(`${listEndpoint}/${encodeURIComponent(deleteTarget.id)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to delete profile.");
      }

      setProfiles((prev) => prev.filter((profile) => profile.id !== deleteTarget.id));
      setForm((prev) => (prev.id === deleteTarget.id ? profileToForm() : prev));
      setStatus(`Deleted ${deleteTarget.displayName}. Existing autograph requests keep their history.`);
      setDeleteTarget(null);
      setDeleteConfirmation("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete profile.");
    } finally {
      setDeletingProfileId(null);
    }
  }

  return (
    <section className="autograph-shell autograph-admin-profiles">
      <header className="autograph-profile-page-header">
        <p className="autograph-hero-kicker">Admin profiles</p>
        <h2 className="autograph-hero-title">Create and curate people profiles</h2>
        <p className="autograph-hero-description">
          Add teachers or students, update public profile details, and keep autograph requests connected to the right person.
        </p>
      </header>

      <div className="autograph-admin-layout">
        <form className="app-surface-card autograph-admin-form" onSubmit={saveProfile}>
          <div className="autograph-section-heading">
            <div>
              <h3 className="autograph-section-title">{isEditing ? "Edit profile" : "Create profile"}</h3>
              <p className="app-copy-soft">Users can still update their own profile after signing in with the same email/user ID.</p>
            </div>
            {isEditing ? (
              <button type="button" className="autograph-secondary-btn" onClick={() => setForm(profileToForm())}>
                New profile
              </button>
            ) : null}
          </div>
          <ProfileFormFields form={form} setForm={setForm} includeUserId />
          <div className="autograph-admin-form-footer">
            <button className="app-button-primary autograph-button-fill" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : isEditing ? "Save changes" : "Create profile"}
            </button>
            {status ? <p className="autograph-status-banner">{status}</p> : null}
            {error ? <p className="app-alert-error autograph-error-banner">{error}</p> : null}
          </div>
        </form>

        <aside className="autograph-admin-side">
          <AdminProfilePreview form={form} isEditing={isEditing} />

          <section className="app-surface-card autograph-admin-roster" aria-label="Profile roster">
            <div className="autograph-admin-roster-header">
              <div>
                <p className="autograph-context-label">Roster</p>
                <h3 className="autograph-profile-detail-title">Profile roster</h3>
              </div>
              <span className="autograph-admin-count">{countLabel(filteredProfiles.length, "profile", "profiles")}</span>
            </div>

            <div className="autograph-admin-roster-controls">
              <label className="autograph-field">
                <span className="app-form-label">Search profiles</span>
                <input
                  className={INPUT_CLASS}
                  value={profileQuery}
                  onChange={(event) => setProfileQuery(event.target.value)}
                  placeholder="Name, email, subject"
                />
              </label>
              <label className="autograph-field">
                <span className="app-form-label">Role</span>
                <select className={INPUT_CLASS} value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "all" | AutographRole)}>
                  <option value="all">All roles</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                </select>
              </label>
            </div>

            <div className="autograph-admin-list">
              {filteredProfiles.length ? (
                filteredProfiles.map((profile) => (
                  <article key={profile.id} className="autograph-profile-card autograph-admin-profile-row">
                    <div className="autograph-profile-card-top">
                      <ProfileAvatar profile={profile} size="small" />
                      <div>
                        <h3 className="autograph-profile-card-name">{profile.displayName}</h3>
                        <p className="autograph-profile-meta">{profile.userId}</p>
                        <p className="autograph-role-chip">{titleCaseRole(profile.role)}</p>
                      </div>
                    </div>
                    <p className="autograph-profile-card-headline">{profile.headline || "No headline yet."}</p>
                    <div className="autograph-request-actions start">
                      <a className="autograph-jump-link autograph-jump-link--subtle" href={`/profiles/${encodeURIComponent(profile.id)}`}>
                        View public page
                      </a>
                      <button type="button" className="autograph-secondary-btn" onClick={() => void editProfile(profile)} disabled={loadingProfileId === profile.id}>
                        {loadingProfileId === profile.id ? "Loading..." : "Edit"}
                      </button>
                      <button
                        type="button"
                        className="autograph-danger-btn autograph-danger-btn--quiet"
                        onClick={() => {
                          setDeleteTarget(profile);
                          setDeleteConfirmation("");
                          setStatus(null);
                          setError(null);
                        }}
                        disabled={deletingProfileId === profile.id}
                        aria-label={`Delete ${profile.displayName}`}
                      >
                        {deletingProfileId === profile.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="autograph-empty-state">No matching profiles.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
      {deleteTarget ? (
        <ProfileDeleteDialog
          profile={deleteTarget}
          confirmationValue={deleteConfirmation}
          isDeleting={deletingProfileId === deleteTarget.id}
          onConfirmationChange={setDeleteConfirmation}
          onCancel={() => {
            if (!deletingProfileId) {
              setDeleteTarget(null);
            }
          }}
          onConfirm={(event) => void deleteProfile(event)}
        />
      ) : null}
    </section>
  );
}
