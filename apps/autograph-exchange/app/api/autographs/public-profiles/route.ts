import { NextResponse } from "next/server";
import { withDisplayAvatarUrls } from "../_profile-payload";
import { autographService } from "../_service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profiles = await autographService.listPublicAutographProfiles();
    return NextResponse.json(withDisplayAvatarUrls(profiles));
  } catch {
    return NextResponse.json({ error: "Unable to load public profiles." }, { status: 500 });
  }
}
