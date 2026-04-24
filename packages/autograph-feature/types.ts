import type React from "react";
import { AUTOGRAPH_API } from "@aartisr/autograph-contract";
import type {
  AutographProfile,
  AutographRequest,
  AutographRole,
  AutographVisibility,
} from "@aartisr/autograph-contract";

export type { AutographProfile, AutographRequest, AutographRole, AutographVisibility } from "@aartisr/autograph-contract";

export type ArchiveSort = "newest" | "oldest";
export type ProfileFormState = { displayName: string; role: AutographRole };
export type RequestFormState = { signerUserId: string; message: string };
export type RoleOption = { value: AutographRole; label: string };
export type AutographSuggestion = { label: string; text: string };

export type SignaturePreset = {
  label: string;
  initials: string;
  hueStart: number;
  hueEnd: number;
  strokeA: string;
  strokeB: string;
  flourish: string;
  wordmarkSize: number;
  wordmarkTilt: number;
  wordmarkSpacing: number;
  monogramSize: number;
  monogramOpacity: number;
};

export type AutographExchangeCopy = {
  signedOutKicker: string;
  signedOutTitle: string;
  signedOutBenefitOneTitle: string;
  signedOutBenefitOneCopy: string;
  signedOutBenefitTwoTitle: string;
  signedOutBenefitTwoCopy: string;
  signedOutBenefitThreeTitle: string;
  signedOutBenefitThreeCopy: string;
  signedOutBenefitsLabel: string;
  heroKicker: string;
  heroTitle: string;
  heroGuidanceLabel: string;
  bookPreviewLabel: string;
  bookCoverLabel: string;
  bookLeftPageLabel: string;
  bookLeftPageTitle: string;
  bookLeftPageDetail: string;
  bookRightPageLabel: string;
  bookRightPageTitle: string;
  bookRightPageDetail: string;
  bookSentLabel: string;
  bookWaitingLabel: string;
  bookSignedLabel: string;
  bookTrustLine: string;
  bookExportLine: string;
  nextActionProfile: string;
  nextActionInbox: string;
  nextActionComposer: string;
  nextActionWaitingForProfiles: string;
  quickStepsAriaLabel: string;
  journeyTitle: string;
  journeySubtitle: string;
  journeyProfileLabel: string;
  journeyRequestLabel: string;
  journeyCollectLabel: string;
  nextMilestoneLabel: string;
  completeLabel: string;
  doneLabel: string;
  nextLabel: string;
  celebrationTitle: string;
  celebrationDetail: string;
  stepOne: string;
  stepTwo: string;
  stepThree: string;
  stepOneTitle: string;
  stepOneDetail: string;
  stepTwoTitle: string;
  stepTwoDetail: string;
  stepThreeTitle: string;
  stepThreeDetail: string;
  requestsSent: string;
  requestsForYou: string;
  signedAutographs: string;
  pendingStatusLabel: string;
  signedStatusLabel: string;
  collectionEmptySummary: string;
  collectionFirstSummary: string;
  collectionStarterSummary: string;
  collectionGrowingSummary: string;
  collectionArchiveSummary: string;
  collectionTitle: string;
  collectionSubtitle: string;
  collectionPieceLabel: string;
  revealTitle: string;
  revealSubtitle: string;
  revealLabel: string;
  revealFromLabel: string;
  keepsakeMessageLabel: string;
  keepsakeAutographLabel: string;
  keepsakeMemoryLabel: string;
  socialKeepsakeLabel: string;
  shareKeepsakeLabel: string;
  copyKeepsakeLabel: string;
  downloadKeepsakeLabel: string;
  downloadFormatLabel: string;
  downloadSvgLabel: string;
  downloadPngLabel: string;
  downloadJpgLabel: string;
  downloadGifLabel: string;
  downloadPdfLabel: string;
  keepsakeSharedStatus: string;
  keepsakeCopiedStatus: string;
  keepsakeDownloadedStatus: string;
  keepsakeUnavailableStatus: string;
  newKeepsakeLabel: string;
  featuredKeepsakeLabel: string;
  treasuredKeepsakeLabel: string;
  savedInCollectionLabel: string;
  stepNeededOnce: string;
  stepReady: string;
  stepCanAsk: string;
  stepCompleteFirst: string;
  profileTitle: string;
  profileCompleteDescription: string;
  profileCompleteTitle: string;
  profileCompleteHint: string;
  profileSkipHint: string;
  jumpToStepTwo: string;
  profileMissingTitle: string;
  profileMissingHint: string;
  profileMissingDescription: string;
  savedRoleLabel: string;
  savedProfile: string;
  savedProfileHint: string;
  signedInIdentityLabel: string;
  signedInIdentityHint: string;
  editProfile: string;
  saveChanges: string;
  saveProfile: string;
  savingProfile: string;
  cancel: string;
  profileAudiencePrefix: string;
  profileAudienceConnector: string;
  profileAudienceFallback: string;
  displayNameLabel: string;
  displayNameHint: string;
  roleLabel: string;
  roleHint: string;
  profileFocusStartLabel: string;
  profileFocusOptionalLabel: string;
  composerFocusStartLabel: string;
  composerFocusLockedLabel: string;
  requestComposerTitle: string;
  requestExplainer: string;
  whoShouldSign: string;
  signerSearchPlaceholder: string;
  signerSearchHint: string;
  signerSearchEmpty: string;
  signerSelectedLabel: string;
  whyAreYouAsking: string;
  requestMessagePlaceholder: string;
  requestMessageHint: string;
  requestMetaHint: string;
  askForAutograph: string;
  sendingRequest: string;
  requestAlreadyPending: string;
  requestSentTitle: string;
  requestSentDetail: string;
  requestSentOutboxCta: string;
  requestAskAnotherCta: string;
  requestPendingForSignerHint: string;
  dismissRequestFeedback: string;
  nextStepCtaProfile: string;
  nextStepCtaComposer: string;
  nextStepCtaInbox: string;
  nextStepCtaOutbox: string;
  nextStepCtaArchive: string;
  saveProfileFirstHint: string;
  youAreAsking: string;
  signerInboxHintPrefix: string;
  signerInboxHintSuffix: string;
  signerInboxFallbackName: string;
  signerListHint: string;
  requestIdeasLabel: string;
  requestPrompts: readonly AutographSuggestion[];
  autographIdeasLabel: string;
  signatureIdeas: readonly AutographSuggestion[];
  inboxSubtitle: string;
  inboxFocusLabel: string;
  waitingCountSuffix: string;
  fromPrefix: string;
  theyAsked: string;
  hideReplyBox: string;
  writeAutograph: string;
  openSigningFormLabel: string;
  signaturePlaceholder: string;
  signatureHint: string;
  useGeneratedSignature: string;
  confirmSignature: string;
  signing: string;
  outboxSubtitle: string;
  outboxFocusLabel: string;
  pendingCountSuffix: string;
  archiveSubtitle: string;
  archiveFocusLabel: string;
  totalCountSuffix: string;
  searchPlaceholder: string;
  searchLabel: string;
  sortLabel: string;
  newestFirst: string;
  oldestFirst: string;
  loadMoreKeepsakes: string;
  loadingMoreKeepsakes: string;
  requestedPrefix: string;
  signedPrefix: string;
  justNow: string;
  recently: string;
  yourAutographLabel: string;
  noOtherProfiles: string;
  noInbox: string;
  noOutbox: string;
  noArchive: string;
};

export interface AutographExchangeScreenProps {
  error?: string | null;
  statusMessage?: string | null;
  nextAction: string;
  hasProfile: boolean;
  myProfile: AutographProfile | null;
  availableSigners: AutographProfile[];
  inbox: AutographRequest[];
  outbox: AutographRequest[];
  filteredArchive: AutographRequest[];
  hasMoreArchive: boolean;
  archiveLoadingMore: boolean;
  onLoadMoreArchive: () => Promise<void>;
  loading: boolean;
  busyAction: string | null;
  roleOptions: RoleOption[];
  profileForm: ProfileFormState;
  setProfileForm: React.Dispatch<React.SetStateAction<ProfileFormState>>;
  requestForm: RequestFormState;
  setRequestForm: React.Dispatch<React.SetStateAction<RequestFormState>>;
  signatureDrafts: Record<string, string>;
  setSignatureDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  expandedRequestId: string | null;
  setExpandedRequestId: React.Dispatch<React.SetStateAction<string | null>>;
  archiveFilter: string;
  setArchiveFilter: React.Dispatch<React.SetStateAction<string>>;
  archiveSort: ArchiveSort;
  setArchiveSort: React.Dispatch<React.SetStateAction<ArchiveSort>>;
  lastCreatedRequest: AutographRequest | null;
  lastSignedRequestId: string | null;
  signaturePreset: SignaturePreset;
  effectiveProfileName: string;
  effectiveProfileRole: AutographRole;
  sessionIdentity: string;
  onProfileSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<boolean>;
  onRequestSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onSignRequest: (requestId: string) => Promise<void>;
  renderSignaturePreview: (preset: SignaturePreset, previewId: string) => React.ReactNode;
  copy?: Partial<AutographExchangeCopy>;
}

export interface AutographApiConfig {
  endpoints?: typeof AUTOGRAPH_API;
  fetcher?: <T>(input: string, init?: RequestInit) => Promise<T>;
}

export type AutographFeatureEventName =
  | "view_loading"
  | "view_signed_out"
  | "view_authenticated"
  | "load_succeeded"
  | "load_failed"
  | "profile_saved"
  | "request_created"
  | "request_signed";

export interface AutographFeatureEvent {
  name: AutographFeatureEventName;
  timestamp: string;
  userId?: string;
  requestId?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export type AutographFeatureEventHandler = (event: AutographFeatureEvent) => void;

export interface SaveProfileInput {
  displayName: string;
  role: AutographRole;
}

export interface CreateRequestInput {
  signerUserId: string;
  message: string;
}

export interface SignRequestInput {
  requestId: string;
  signatureText: string;
  visibility?: AutographVisibility;
}

export interface UseAutographExchangeResult {
  profiles: AutographProfile[];
  requests: AutographRequest[];
  myProfile: AutographProfile | null;
  availableSigners: AutographProfile[];
  inbox: AutographRequest[];
  outbox: AutographRequest[];
  archive: AutographRequest[];
  hasMoreArchive: boolean;
  archiveLoadingMore: boolean;
  loading: boolean;
  error: string | null;
  busyAction: string | null;
  reload: () => Promise<void>;
  saveProfile: (input: SaveProfileInput) => Promise<void>;
  requestAutograph: (input: CreateRequestInput) => Promise<AutographRequest>;
  signAutograph: (input: SignRequestInput) => Promise<void>;
  loadMoreArchive: () => Promise<void>;
}

export type AutographFeatureAuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AutographFeatureViewer {
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface AutographExchangeFeatureProps {
  /**
   * Authentication state resolved by the consuming host application.
   * The reusable feature package does not own sessions or authentication.
   */
  authStatus: AutographFeatureAuthStatus;
  /**
   * Current viewer identity resolved by the consuming host application.
   * Pass `null` when signed out.
   */
  viewer: AutographFeatureViewer | null;
  api?: AutographApiConfig;
  copy?: Partial<AutographExchangeCopy>;
  roleLabels?: Partial<Record<AutographRole, string>>;
  loadingMessage?: string;
  signedOutMessage?: string;
  signInHref?: string;
  signInLabel?: string;
  renderShell?: (content: React.ReactNode) => React.ReactNode;
  renderSignaturePreview?: (preset: SignaturePreset, previewId: string) => React.ReactNode;
  onEvent?: AutographFeatureEventHandler;
}

export interface UseAutographExchangeViewModelArgs {
  roleLabels?: Partial<Record<AutographRole, string>>;
  userId?: string;
  sessionName?: string | null;
  sessionEmail?: string | null;
  profileDisplayName?: string;
  profileRole?: AutographRole;
  archive: AutographRequest[];
  hasMoreArchive: boolean;
  archiveLoadingMore: boolean;
  onLoadMoreArchive: () => Promise<void>;
  saveProfile: (input: SaveProfileInput) => Promise<void>;
  requestAutograph: (input: RequestFormState) => Promise<AutographRequest>;
  signAutograph: (input: { requestId: string; signatureText: string }) => Promise<void>;
}
