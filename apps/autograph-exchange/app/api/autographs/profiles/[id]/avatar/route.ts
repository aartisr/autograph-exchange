import { NextResponse } from "next/server";
import { autographService } from "../../../_service";
import { parseDataImageAvatar } from "../../../_profile-payload";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const profile = await autographService.getPublicAutographProfile(params.id);
  const avatar = parseDataImageAvatar(profile?.avatarUrl);

  if (!avatar) {
    return new NextResponse(null, { status: 404 });
  }

  const body = avatar.bytes.buffer.slice(
    avatar.bytes.byteOffset,
    avatar.bytes.byteOffset + avatar.bytes.byteLength,
  ) as ArrayBuffer;

  return new NextResponse(body, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Content-Length": String(avatar.bytes.length),
      "Content-Type": avatar.mimeType,
    },
  });
}
