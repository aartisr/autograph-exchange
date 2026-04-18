import type React from "react";
import { AUTOGRAPH_API } from "../autograph-contract";
import type {
  AutographProfile,
  AutographRequest,
  AutographRole,
  AutographVisibility,
} from "../autograph-contract";

export type { AutographProfile, AutographRequest, AutographRole, AutographVisibility } from "../autograph-contract";

export type ArchiveSort = "newest" | "oldest";
export type ProfileFormState = { displayName: string; role: AutographRole };
export type RequestFormState = { signerUserId: string; message: string };
export type RoleOption = { value: AutographRole; label: string };

export type SignaturePreset = {
  label: string;
  hueStart: number;
  hueEnd: number;
  strokeA: string;
  strokeB: string;
};

export type AutographExchangeCopy = {
  heroKicker: string;
  heroTitle: string;
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
  stepNeededOnce: string;
  stepReady: string;
  stepCanAsk: string;
  stepCompleteFirst: string;
  savedProfile: string;
  savedProfileHint: string;
  editProfile: string;
  saveChanges: string;
  cancel: string;
  profileAudiencePrefix: string;
  requestExplainer: string;
  whoShouldSign: string;
  whyAreYouAsking: string;
  askForAutograph: string;
  saveProfileFirstHint: string;
  youAreAsking: string;
  signerInboxHintPrefix: string;
  signerListHint: string;
  requestIdeasLabel: string;
  autographIdeasLabel: string;
  inboxSubtitle: string;
  waitingCountSuffix: string;
  fromPrefix: string;
  theyAsked: string;
  hideReplyBox: string;
  writeAutograph: string;
  useGeneratedSignature: string;
  confirmSignature: string;
  signing: string;
  outboxSubtitle: string;
  pendingCountSuffix: string;
  archiveSubtitle: string;
  totalCountSuffix: string;
  searchPlaceholder: string;
  searchLabel: string;
  sortLabel: string;
  newestFirst: string;
  oldestFirst: string;
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
  lastSignedRequestId: string | null;
  signaturePreset: SignaturePreset;
  effectiveProfileName: string;
  effectiveProfileRole: AutographRole;
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
  loading: boolean;
  error: string | null;
  busyAction: string | null;
  reload: () => Promise<void>;
  saveProfile: (input: SaveProfileInput) => Promise<void>;
  requestAutograph: (input: CreateRequestInput) => Promise<void>;
  signAutograph: (input: SignRequestInput) => Promise<void>;
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
  saveProfile: (input: SaveProfileInput) => Promise<void>;
  requestAutograph: (input: RequestFormState) => Promise<void>;
  signAutograph: (input: { requestId: string; signatureText: string }) => Promise<void>;
}
