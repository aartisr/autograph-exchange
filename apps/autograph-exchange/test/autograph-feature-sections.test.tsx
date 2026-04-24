import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_AUTOGRAPH_COPY } from "../../../packages/autograph-feature/copy";
import {
  AutographProfileAdminPanel,
  AutographProfileDirectory,
  AutographProfileShowcase,
} from "../../../packages/autograph-feature/profile-components";
import {
  ArchiveLane,
  HeroSection,
  InboxLane,
  OutboxSection,
  ProfileSection,
  RequestComposerSection,
} from "../../../packages/autograph-feature/screen-sections";
import type { AutographProfile, AutographRequest } from "../../../packages/autograph-feature/types";

const sampleProfile: AutographProfile = {
  id: "profile-1",
  userId: "user-1",
  displayName: "Asha Raman",
  role: "student",
  updatedAt: "2026-04-18T10:00:00.000Z",
};

const signerProfile: AutographProfile = {
  id: "profile-2",
  userId: "user-2",
  displayName: "Ravi Kumar",
  role: "teacher",
  headline: "Teacher and community mentor",
  bio: "Guides students with practical, compassionate encouragement.",
  affiliation: "Forever Lotus",
  location: "Online",
  subjects: ["Meditation", "Mentorship"],
  interests: ["Service", "Music"],
  signaturePrompt: "Ask me for one memory or one blessing for your next step.",
  updatedAt: "2026-04-18T10:00:00.000Z",
};

const sampleRequest: AutographRequest = {
  id: "request-1",
  requesterUserId: "user-1",
  requesterDisplayName: "Asha Raman",
  requesterRole: "student",
  signerUserId: "user-2",
  signerDisplayName: "Ravi Kumar",
  signerRole: "teacher",
  message: "Thank you for your guidance.",
  status: "pending",
  createdAt: "2026-04-18T10:00:00.000Z",
};

const roleOptions: Array<{ value: AutographProfile["role"]; label: string }> = [
  { value: "student", label: "Learner" },
  { value: "teacher", label: "Guide" },
];

const emptyProfileForm = {
  displayName: "",
  role: "student" as const,
  headline: "",
  bio: "",
  avatarUrl: "",
  affiliation: "",
  location: "",
  subjects: "",
  interests: "",
  signaturePrompt: "",
};

describe("autograph feature sections", () => {
  it("renders reusable public profile directory, showcase, and admin surfaces", () => {
    const directoryHtml = renderToStaticMarkup(<AutographProfileDirectory profiles={[signerProfile]} />);
    const showcaseHtml = renderToStaticMarkup(
      <AutographProfileShowcase profile={signerProfile} viewer={{ id: "user-2", email: "ravi@example.com" }} canEdit />,
    );
    const adminHtml = renderToStaticMarkup(<AutographProfileAdminPanel initialProfiles={[signerProfile]} />);

    expect(directoryHtml).toContain("autograph-profile-directory");
    expect(directoryHtml).toContain("Teacher and community mentor");
    expect(directoryHtml).toContain("Meditation");
    expect(showcaseHtml).toContain("autograph-profile-showcase");
    expect(showcaseHtml).toContain("Your public profile");
    expect(showcaseHtml).not.toContain("Request an autograph");
    expect(adminHtml).toContain("autograph-admin-profiles");
    expect(adminHtml).toContain("Create and curate people profiles");
    expect(adminHtml).toContain("View public page");
  });

  it("renders the hero section with package-owned structure", () => {
    const html = renderToStaticMarkup(
      <HeroSection
        copy={DEFAULT_AUTOGRAPH_COPY}
        nextAction="Start here"
        outboxCount={2}
        inboxCount={3}
        archiveCount={4}
      />,
    );

    expect(html).toContain("autograph-hero");
    expect(html).toContain("autograph-book-preview");
    expect(html).toContain(DEFAULT_AUTOGRAPH_COPY.bookPreviewLabel);
    expect(html).toContain("autograph-hero-stats");
    expect(html).toContain(DEFAULT_AUTOGRAPH_COPY.requestsSent);
    expect(html).toContain(">2<");
    expect(html).toContain(">3<");
    expect(html).toContain(">4<");
  });

  it("renders the profile and request sections with modular package classes", () => {
    const setProfileForm = vi.fn();
    const setRequestForm = vi.fn();

    const profileHtml = renderToStaticMarkup(
      <ProfileSection
        copy={DEFAULT_AUTOGRAPH_COPY}
        hasProfile={false}
        isEditingProfile
        setIsEditingProfile={vi.fn()}
        effectiveProfileName="Asha Raman"
        effectiveProfileRole="student"
        sessionIdentity="asha@example.com"
        profileForm={emptyProfileForm}
        setProfileForm={setProfileForm}
        roleOptions={roleOptions}
        busyAction={null}
        onProfileSubmit={async () => true}
      />,
    );

    const requestHtml = renderToStaticMarkup(
      <RequestComposerSection
        copy={DEFAULT_AUTOGRAPH_COPY}
        hasProfile
        loading={false}
        myProfile={sampleProfile}
        availableSigners={[signerProfile]}
        roleOptions={roleOptions}
        outbox={[]}
        lastCreatedRequest={null}
        requestForm={{ signerUserId: "user-2", message: "" }}
        setRequestForm={setRequestForm}
        busyAction={null}
        onRequestSubmit={async () => {}}
        isFocused={false}
      />,
    );

    expect(profileHtml).toContain("autograph-section-card");
    expect(profileHtml).toContain("autograph-profile-grid");
    expect(profileHtml).toContain("autograph-field-hint");
    expect(profileHtml).toContain("asha@example.com");
    expect(requestHtml).toContain("autograph-section-card");
    expect(requestHtml).toContain("Choose one person");
    expect(requestHtml).toContain("Ravi Kumar Guide");
    expect(requestHtml).toContain(DEFAULT_AUTOGRAPH_COPY.viewProfileBeforeRequest);
    expect(requestHtml).toContain('href="/profiles/profile-2"');
    expect(requestHtml).toContain("autograph-form-actions");
    expect(requestHtml).toContain("autograph-suggestion-chip");
  });

  it("renders inline request confirmation on the composer tile and disables duplicate submit", () => {
    const html = renderToStaticMarkup(
      <RequestComposerSection
        copy={DEFAULT_AUTOGRAPH_COPY}
        hasProfile
        loading={false}
        myProfile={sampleProfile}
        availableSigners={[signerProfile]}
        roleOptions={roleOptions}
        outbox={[sampleRequest]}
        lastCreatedRequest={sampleRequest}
        requestForm={{ signerUserId: "user-2", message: sampleRequest.message }}
        setRequestForm={vi.fn()}
        busyAction={null}
        onRequestSubmit={async () => {}}
        isFocused={false}
      />,
    );

    expect(html).toContain("autograph-request-submit-state");
    expect(html).toContain(DEFAULT_AUTOGRAPH_COPY.requestSentTitle);
    expect(html).toContain(DEFAULT_AUTOGRAPH_COPY.requestSentOutboxCta);
    expect(html).toContain(DEFAULT_AUTOGRAPH_COPY.requestAskAnotherCta);
    expect(html).toContain(DEFAULT_AUTOGRAPH_COPY.dismissRequestFeedback);
    expect(html).toContain("disabled");
  });

  it("renders a spinner on the request button while the request is sending", () => {
    const html = renderToStaticMarkup(
      <RequestComposerSection
        copy={DEFAULT_AUTOGRAPH_COPY}
        hasProfile
        loading={false}
        myProfile={sampleProfile}
        availableSigners={[signerProfile]}
        roleOptions={roleOptions}
        outbox={[]}
        lastCreatedRequest={null}
        requestForm={{ signerUserId: "user-2", message: sampleRequest.message }}
        setRequestForm={vi.fn()}
        busyAction="request"
        onRequestSubmit={async () => {}}
        isFocused={false}
      />,
    );

    expect(html).toContain("autograph-button-spinner");
    expect(html).toContain(DEFAULT_AUTOGRAPH_COPY.sendingRequest);
    expect(html).toContain("disabled");
  });

  it("renders inbox, archive, and outbox sections with package-owned card classes", () => {
    const signedRequest: AutographRequest = {
      ...sampleRequest,
      id: "request-2",
      status: "signed",
      signatureText: "With blessings and gratitude.",
      signedAt: "2026-04-18T12:00:00.000Z",
    };

    const inboxHtml = renderToStaticMarkup(
      <InboxLane
        copy={DEFAULT_AUTOGRAPH_COPY}
        inbox={[sampleRequest]}
        roleOptions={roleOptions}
        lastSignedRequestId={null}
        expandedRequestId="request-1"
        setExpandedRequestId={vi.fn()}
        signaturePreset={{
          label: "Asha",
          hueStart: 20,
          hueEnd: 40,
          strokeA: "#111111",
          strokeB: "#222222",
        }}
        signatureDrafts={{ "request-1": "With gratitude." }}
        setSignatureDrafts={vi.fn()}
        busyAction={null}
        renderSignaturePreview={() => <div>preview</div>}
        onSignRequest={async () => {}}
      />,
    );

    const archiveHtml = renderToStaticMarkup(
      <ArchiveLane
        copy={DEFAULT_AUTOGRAPH_COPY}
        filteredArchive={[signedRequest]}
        roleOptions={roleOptions}
        hasMoreArchive={false}
        archiveLoadingMore={false}
        onLoadMoreArchive={async () => {}}
        archiveFilter=""
        setArchiveFilter={vi.fn()}
        archiveSort="newest"
        setArchiveSort={vi.fn()}
        lastSignedRequestId={null}
      />,
    );

    const outboxHtml = renderToStaticMarkup(
      <OutboxSection copy={DEFAULT_AUTOGRAPH_COPY} outbox={[sampleRequest]} roleOptions={roleOptions} isFocused={false} />,
    );

    expect(inboxHtml).toContain("autograph-lane autograph-lane-pending");
    expect(inboxHtml).toContain("Learner to Guide");
    expect(inboxHtml).toContain("autograph-sign-panel");
    expect(inboxHtml).toContain("autograph-card-title");
    expect(archiveHtml).toContain("autograph-lane autograph-lane-archive");
    expect(archiveHtml).toContain("autograph-archive-message");
    expect(archiveHtml).toContain("autograph-signature-quote");
    expect(archiveHtml).toContain("autograph-download-format");
    expect(archiveHtml).toContain('option value="svg"');
    expect(archiveHtml).toContain('option value="png"');
    expect(archiveHtml).toContain('option value="jpg"');
    expect(archiveHtml).toContain('option value="gif"');
    expect(archiveHtml).toContain('option value="pdf"');
    expect(outboxHtml).toContain("autograph-outbox-card");
    expect(outboxHtml).toContain("autograph-outbox-message");
  });
});
