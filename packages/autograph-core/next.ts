import { NextRequest, NextResponse } from "next/server";
import type { UpsertAutographProfileInput } from "@aartisr/autograph-contract";
import type { AutographService } from "./service";

type FeatureEnabledCheck = () => boolean;
type SessionUserResolver = () => Promise<string>;
type AdminCheck = (userId: string) => boolean | Promise<boolean>;

export interface AutographNextRouteConfig {
  service: AutographService;
  getUserId: SessionUserResolver;
  isAdmin?: AdminCheck;
  isEnabled?: FeatureEnabledCheck;
}

function featureDisabledResponse() {
  return NextResponse.json({ error: "Autograph exchange is not enabled." }, { status: 404 });
}

function isAuthRequiredError(error: unknown) {
  return error instanceof Error && error.message === "AUTH_REQUIRED";
}

function isAdminRequiredError(error: unknown) {
  return error instanceof Error && error.message === "ADMIN_REQUIRED";
}

function handleError(error: unknown, fallbackMessage: string) {
  if (isAuthRequiredError(error)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (isAdminRequiredError(error)) {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

function featureIsDisabled(isEnabled?: FeatureEnabledCheck) {
  return typeof isEnabled === "function" && !isEnabled();
}

async function requireAdminUserId(config: AutographNextRouteConfig): Promise<string> {
  const userId = await config.getUserId();
  const isAdmin = config.isAdmin ? await config.isAdmin(userId) : false;

  if (!isAdmin) {
    throw new Error("ADMIN_REQUIRED");
  }

  return userId;
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function decodeCursor(cursor: string | null): number {
  if (!cursor) {
    return 0;
  }

  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const payload = JSON.parse(decoded) as { offset?: number };
    const offset = payload?.offset;
    return Number.isFinite(offset) && typeof offset === "number" && offset > 0 ? Math.floor(offset) : 0;
  } catch {
    return 0;
  }
}

function encodeCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ offset }), "utf8").toString("base64url");
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function normalizeProfileBody(body: Record<string, unknown> | null | undefined): UpsertAutographProfileInput {
  return {
    displayName: typeof body?.displayName === "string" ? body.displayName : "",
    role: body?.role as UpsertAutographProfileInput["role"],
    headline: typeof body?.headline === "string" ? body.headline : undefined,
    bio: typeof body?.bio === "string" ? body.bio : undefined,
    avatarUrl: typeof body?.avatarUrl === "string" ? body.avatarUrl : undefined,
    affiliation: typeof body?.affiliation === "string" ? body.affiliation : undefined,
    location: typeof body?.location === "string" ? body.location : undefined,
    subjects: normalizeStringArray(body?.subjects),
    interests: normalizeStringArray(body?.interests),
    signaturePrompt: typeof body?.signaturePrompt === "string" ? body.signaturePrompt : undefined,
  };
}

export function createAutographProfilesGetHandler(config: AutographNextRouteConfig) {
  return async function GET() {
    if (featureIsDisabled(config.isEnabled)) {
      return featureDisabledResponse();
    }

    try {
      await config.getUserId();
      const profiles = await config.service.listAutographProfiles();
      return NextResponse.json(profiles);
    } catch (error) {
      if (isAuthRequiredError(error)) {
        return NextResponse.json({ error: "Authentication required." }, { status: 401 });
      }

      return NextResponse.json({ error: "Unable to load profiles." }, { status: 500 });
    }
  };
}

export function createAutographProfilesPutHandler(config: AutographNextRouteConfig) {
  return async function PUT(req: NextRequest) {
    if (featureIsDisabled(config.isEnabled)) {
      return featureDisabledResponse();
    }

    try {
      const userId = await config.getUserId();
      const body = await req.json();

      const profile = await config.service.upsertAutographProfile(userId, normalizeProfileBody(body));

      return NextResponse.json(profile);
    } catch (error) {
      return handleError(error, "Unable to save profile.");
    }
  };
}

export function createAutographProfileGetHandler(config: AutographNextRouteConfig) {
  return async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    if (featureIsDisabled(config.isEnabled)) {
      return featureDisabledResponse();
    }

    try {
      const profile = await config.service.getPublicAutographProfile(params.id);
      if (!profile) {
        return NextResponse.json({ error: "Profile not found." }, { status: 404 });
      }

      return NextResponse.json(profile);
    } catch {
      return NextResponse.json({ error: "Unable to load profile." }, { status: 500 });
    }
  };
}

export function createAutographProfilePutHandler(config: AutographNextRouteConfig) {
  return async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    if (featureIsDisabled(config.isEnabled)) {
      return featureDisabledResponse();
    }

    try {
      const userId = await config.getUserId();
      const canManageAllProfiles = config.isAdmin ? await config.isAdmin(userId) : false;
      const body = await req.json();

      const profile = await config.service.updateAutographProfile(
        userId,
        params.id,
        normalizeProfileBody(body),
        { canManageAllProfiles },
      );

      return NextResponse.json(profile);
    } catch (error) {
      return handleError(error, "Unable to update profile.");
    }
  };
}

export function createAutographPublicProfilesGetHandler(config: AutographNextRouteConfig) {
  return async function GET() {
    if (featureIsDisabled(config.isEnabled)) {
      return featureDisabledResponse();
    }

    try {
      const profiles = await config.service.listPublicAutographProfiles();
      return NextResponse.json(profiles);
    } catch {
      return NextResponse.json({ error: "Unable to load public profiles." }, { status: 500 });
    }
  };
}

export function createAutographAdminProfilesGetHandler(config: AutographNextRouteConfig) {
  return async function GET() {
    if (featureIsDisabled(config.isEnabled)) {
      return featureDisabledResponse();
    }

    try {
      await requireAdminUserId(config);
      const profiles = await config.service.listAutographProfiles();
      return NextResponse.json(profiles);
    } catch (error) {
      return handleError(error, "Unable to load admin profiles.");
    }
  };
}

export function createAutographAdminProfilesPostHandler(config: AutographNextRouteConfig) {
  return async function POST(req: NextRequest) {
    if (featureIsDisabled(config.isEnabled)) {
      return featureDisabledResponse();
    }

    try {
      await requireAdminUserId(config);
      const body = await req.json();
      const userId = typeof body?.userId === "string" ? body.userId : "";
      const profile = await config.service.adminUpsertAutographProfile({
        ...normalizeProfileBody(body),
        userId,
      });

      return NextResponse.json(profile, { status: 201 });
    } catch (error) {
      return handleError(error, "Unable to create admin profile.");
    }
  };
}

export function createAutographAdminProfilePutHandler(config: AutographNextRouteConfig) {
  return async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    if (featureIsDisabled(config.isEnabled)) {
      return featureDisabledResponse();
    }

    try {
      await requireAdminUserId(config);
      const body = await req.json();
      const existing = (await config.service.listAutographProfiles()).find((profile) => profile.id === params.id);

      if (!existing) {
        return NextResponse.json({ error: "Profile not found." }, { status: 404 });
      }

      const profile = await config.service.adminUpsertAutographProfile({
        ...normalizeProfileBody(body),
        userId: typeof body?.userId === "string" && body.userId.trim() ? body.userId : existing.userId,
        id: params.id,
      });

      return NextResponse.json(profile);
    } catch (error) {
      return handleError(error, "Unable to update admin profile.");
    }
  };
}

export function createAutographRequestsGetHandler(config: AutographNextRouteConfig) {
  return async function GET(req: NextRequest) {
    if (featureIsDisabled(config.isEnabled)) {
      return featureDisabledResponse();
    }

    try {
      const userId = await config.getUserId();
      const requests = await config.service.listVisibleAutographRequests(userId);
      const searchParams = req?.nextUrl?.searchParams ?? new URLSearchParams();
      const status = searchParams.get("status");
      const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
      const cursor = searchParams.get("cursor");
      const limit = Math.min(100, parsePositiveInt(searchParams.get("limit"), 24));

      const needsPaging = Boolean(status || query || cursor || searchParams.has("limit"));

      if (!needsPaging) {
        return NextResponse.json(requests);
      }

      const statusFiltered =
        status === "pending" || status === "signed"
          ? requests.filter((item) => item.status === status)
          : requests;

      const filtered = query
        ? statusFiltered.filter((item) => {
            const haystack = [
              item.requesterDisplayName,
              item.signerDisplayName,
              item.message,
              item.signatureText ?? "",
            ]
              .join(" ")
              .toLowerCase();
            return haystack.includes(query);
          })
        : statusFiltered;

      const offset = decodeCursor(cursor);
      const items = filtered.slice(offset, offset + limit);
      const nextOffset = offset + items.length;
      const hasMore = nextOffset < filtered.length;

      return NextResponse.json({
        items,
        nextCursor: hasMore ? encodeCursor(nextOffset) : null,
        hasMore,
        total: filtered.length,
      });
    } catch (error) {
      if (isAuthRequiredError(error)) {
        return NextResponse.json({ error: "Authentication required." }, { status: 401 });
      }

      return NextResponse.json({ error: "Unable to load autograph requests." }, { status: 500 });
    }
  };
}

export function createAutographRequestsPostHandler(config: AutographNextRouteConfig) {
  return async function POST(req: NextRequest) {
    if (featureIsDisabled(config.isEnabled)) {
      return featureDisabledResponse();
    }

    try {
      const userId = await config.getUserId();
      const body = await req.json();

      const request = await config.service.createAutographRequest(userId, {
        signerUserId: typeof body?.signerUserId === "string" ? body.signerUserId : undefined,
        signerProfileId: typeof body?.signerProfileId === "string" ? body.signerProfileId : undefined,
        message: typeof body?.message === "string" ? body.message : "",
      });

      return NextResponse.json(request, { status: 201 });
    } catch (error) {
      return handleError(error, "Unable to create autograph request.");
    }
  };
}

export function createAutographSignPostHandler(config: AutographNextRouteConfig) {
  return async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    if (featureIsDisabled(config.isEnabled)) {
      return featureDisabledResponse();
    }

    try {
      const userId = await config.getUserId();
      const body = await req.json();

      const request = await config.service.signAutographRequest(userId, params.id, {
        signatureText: typeof body?.signatureText === "string" ? body.signatureText : "",
        visibility: body?.visibility === "public" || body?.visibility === "private" ? body.visibility : undefined,
      });

      return NextResponse.json(request);
    } catch (error) {
      return handleError(error, "Unable to sign autograph request.");
    }
  };
}
