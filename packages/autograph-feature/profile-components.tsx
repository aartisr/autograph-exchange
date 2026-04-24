"use client";

import React from "react";
import type { AutographProfile, AutographRole, PublicAutographProfile } from "./types";
import { INPUT_CLASS, titleCaseRole } from "./screen-utils";

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

function ProfileAvatar({ profile, size = "large" }: { profile: PublicAutographProfile; size?: "small" | "large" }) {
  const className = `autograph-profile-avatar autograph-profile-avatar-${size}`;

  if (profile.avatarUrl) {
    return (
      <img
        className={className}
        src={profile.avatarUrl}
        alt={`${profile.displayName} profile`}
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

export function AutographProfileDirectory({
  profiles,
  title = "People you can ask",
  subtitle = "Browse teachers, students, and community members, then open a profile to request a meaningful autograph.",
}: {
  profiles: PublicAutographProfile[];
  title?: string;
  subtitle?: string;
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
            <a className="autograph-profile-card-link" href={`/profiles/${encodeURIComponent(profile.id)}`}>
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
  requestEndpoint = "/api/autographs/requests",
  signInHref = "/sign-in",
}: {
  profile: PublicAutographProfile;
  viewer: ViewerProfile | null;
  requestEndpoint?: string;
  signInHref?: string;
}) {
  const [message, setMessage] = React.useState(profile.signaturePrompt ?? "");
  const [status, setStatus] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSending, setIsSending] = React.useState(false);

  if (!viewer) {
    return (
      <div className="autograph-profile-action-card">
        <p className="autograph-context-label">Request an autograph</p>
        <p className="autograph-context-detail">Sign in to ask {profile.displayName} for an autograph from this profile.</p>
        <a className="app-button-primary autograph-profile-primary-link" href={signInHref}>
          Sign in to request
        </a>
      </div>
    );
  }

  return (
    <form
      className="autograph-profile-action-card"
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
      <p className="autograph-context-label">Request an autograph</p>
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
      <button className="app-button-primary autograph-button-fill" type="submit" disabled={isSending || !message.trim()}>
        {isSending ? "Sending..." : `Ask ${profile.displayName}`}
      </button>
      {status ? <p className="autograph-status-banner">{status}</p> : null}
      {error ? <p className="app-alert-error autograph-error-banner">{error}</p> : null}
    </form>
  );
}

export function AutographProfileShowcase({
  profile,
  viewer,
  canEdit = false,
}: {
  profile: PublicAutographProfile;
  viewer: ViewerProfile | null;
  canEdit?: boolean;
}) {
  return (
    <section className="autograph-shell autograph-profile-showcase">
      <article className="autograph-profile-hero-card">
        <div className="autograph-profile-hero-main">
          <ProfileAvatar profile={profile} />
          <div className="autograph-profile-identity">
            <p className="autograph-hero-kicker">{titleCaseRole(profile.role)} profile</p>
            <h2 className="autograph-profile-name">{profile.displayName}</h2>
            <p className="autograph-profile-headline">{profile.headline || "Thoughtful autograph exchange participant"}</p>
            <ProfileMeta profile={profile} />
            <div className="autograph-profile-hero-actions">
              <a className="autograph-secondary-btn" href="/profiles">
                Browse profiles
              </a>
              {canEdit ? (
                <a className="autograph-secondary-btn" href="/#autograph-profile-setup">
                  Edit my profile
                </a>
              ) : null}
            </div>
          </div>
        </div>
        {canEdit ? (
          <div className="autograph-profile-action-card">
            <p className="autograph-context-label">Your public profile</p>
            <p className="autograph-context-detail">
              This is how other people see you before they ask for your autograph.
            </p>
            <a className="app-button-primary autograph-profile-primary-link" href="/#autograph-profile-setup">
              Edit my profile
            </a>
          </div>
        ) : (
          <AutographProfileRequestPanel profile={profile} viewer={viewer} />
        )}
      </article>

      <div className="autograph-profile-detail-grid">
        <article className="app-surface-card autograph-profile-detail-card">
          <p className="autograph-context-label">About</p>
          <p className="autograph-profile-bio">{profile.bio || "This profile is ready for a short introduction."}</p>
        </article>
        <article className="app-surface-card autograph-profile-detail-card">
          <p className="autograph-context-label">Focus areas</p>
          <TagList label={`${profile.displayName} focus areas`} tags={profile.subjects} />
          {!profile.subjects?.length ? <p className="app-copy-soft">No focus areas added yet.</p> : null}
        </article>
        <article className="app-surface-card autograph-profile-detail-card">
          <p className="autograph-context-label">Interests</p>
          <TagList label={`${profile.displayName} interests`} tags={profile.interests} />
          {!profile.interests?.length ? <p className="app-copy-soft">No interests added yet.</p> : null}
        </article>
        <article className="app-surface-card autograph-profile-detail-card">
          <p className="autograph-context-label">Prompt</p>
          <p className="autograph-profile-bio">
            {profile.signaturePrompt || `Ask ${profile.displayName} for a favorite memory, encouragement, or blessing.`}
          </p>
        </article>
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
        <input className={INPUT_CLASS} value={form.displayName} required onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))} />
      </label>
      <label className="autograph-field">
        <span className="app-form-label">Role</span>
        <select className={INPUT_CLASS} value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as AutographRole }))}>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
      </label>
      <label className="autograph-field">
        <span className="app-form-label">Headline</span>
        <input className={INPUT_CLASS} value={form.headline} maxLength={120} onChange={(event) => setForm((prev) => ({ ...prev, headline: event.target.value }))} />
      </label>
      <label className="autograph-field">
        <span className="app-form-label">Affiliation</span>
        <input className={INPUT_CLASS} value={form.affiliation} onChange={(event) => setForm((prev) => ({ ...prev, affiliation: event.target.value }))} />
      </label>
      <label className="autograph-field">
        <span className="app-form-label">Location</span>
        <input className={INPUT_CLASS} value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} />
      </label>
      <label className="autograph-field">
        <span className="app-form-label">Avatar URL</span>
        <input className={INPUT_CLASS} value={form.avatarUrl} onChange={(event) => setForm((prev) => ({ ...prev, avatarUrl: event.target.value }))} />
      </label>
      <label className="autograph-field autograph-admin-wide">
        <span className="app-form-label">Bio</span>
        <textarea className={INPUT_CLASS} rows={4} maxLength={500} value={form.bio} onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))} />
      </label>
      <label className="autograph-field">
        <span className="app-form-label">Subjects or focus areas</span>
        <input className={INPUT_CLASS} value={form.subjects} onChange={(event) => setForm((prev) => ({ ...prev, subjects: event.target.value }))} placeholder="Math, Music, Mentorship" />
      </label>
      <label className="autograph-field">
        <span className="app-form-label">Interests</span>
        <input className={INPUT_CLASS} value={form.interests} onChange={(event) => setForm((prev) => ({ ...prev, interests: event.target.value }))} placeholder="Robotics, Poetry, Service" />
      </label>
      <label className="autograph-field autograph-admin-wide">
        <span className="app-form-label">Autograph prompt</span>
        <input className={INPUT_CLASS} value={form.signaturePrompt} maxLength={180} onChange={(event) => setForm((prev) => ({ ...prev, signaturePrompt: event.target.value }))} />
      </label>
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
  const isEditing = Boolean(form.id);

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
          <button className="app-button-primary autograph-button-fill" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : isEditing ? "Save changes" : "Create profile"}
          </button>
          {status ? <p className="autograph-status-banner">{status}</p> : null}
          {error ? <p className="app-alert-error autograph-error-banner">{error}</p> : null}
        </form>

        <div className="autograph-admin-list">
          {profiles.map((profile) => (
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
                <button type="button" className="autograph-secondary-btn" onClick={() => setForm(profileToForm(profile))}>
                  Edit
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
