export const AUTOGRAPH_PROFILES_MODULE = "autograph_profiles";
export const AUTOGRAPH_REQUESTS_MODULE = "autograph_requests";

export const AUTOGRAPH_API = {
  profiles: "/api/autographs/profiles",
  requests: "/api/autographs/requests",
  signRequest: (requestId: string) => `/api/autographs/requests/${encodeURIComponent(requestId)}/sign`,
} as const;

export type AutographRole = "student" | "teacher";
export type AutographStatus = "pending" | "signed";
export type AutographVisibility = "public" | "private";

export interface AutographProfile {
  id: string;
  userId: string;
  displayName: string;
  role: AutographRole;
  updatedAt: string;
}

export interface AutographRequest {
  id: string;
  requesterUserId: string;
  requesterDisplayName: string;
  requesterRole: AutographRole;
  signerUserId: string;
  signerDisplayName: string;
  signerRole: AutographRole;
  message: string;
  status: AutographStatus;
  signatureText?: string;
  visibility?: AutographVisibility;
  createdAt: string;
  signedAt?: string;
}

export interface AutographRequestPage {
  items: AutographRequest[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface UpsertAutographProfileInput {
  displayName: string;
  role: AutographRole;
}

export interface CreateAutographRequestInput {
  signerUserId: string;
  message: string;
}

export interface SignAutographRequestInput {
  signatureText: string;
  visibility?: AutographVisibility;
}

export interface AutographDashboardData {
  profiles: AutographProfile[];
  requests: AutographRequest[];
}

export interface AutographErrorResponse {
  error: string;
}
