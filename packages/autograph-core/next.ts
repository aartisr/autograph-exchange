import { NextRequest, NextResponse } from "next/server";
import type { AutographService } from "./service";

type FeatureEnabledCheck = () => boolean;
type SessionUserResolver = () => Promise<string>;

export interface AutographNextRouteConfig {
  service: AutographService;
  getUserId: SessionUserResolver;
  isEnabled?: FeatureEnabledCheck;
}

function featureDisabledResponse() {
  return NextResponse.json({ error: "Autograph exchange is not enabled." }, { status: 404 });
}

function isAuthRequiredError(error: unknown) {
  return error instanceof Error && error.message === "AUTH_REQUIRED";
}

function handleError(error: unknown, fallbackMessage: string) {
  if (isAuthRequiredError(error)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

function featureIsDisabled(isEnabled?: FeatureEnabledCheck) {
  return typeof isEnabled === "function" && !isEnabled();
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

      const profile = await config.service.upsertAutographProfile(userId, {
        displayName: typeof body?.displayName === "string" ? body.displayName : "",
        role: body?.role,
      });

      return NextResponse.json(profile);
    } catch (error) {
      return handleError(error, "Unable to save profile.");
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
        signerUserId: typeof body?.signerUserId === "string" ? body.signerUserId : "",
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
