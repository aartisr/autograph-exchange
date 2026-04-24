import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AutographProfileShowcase } from "@aartisr/autograph-feature/profile-components";
import { auth } from "@/auth";
import { autographService } from "../../api/autographs/_service";
import { withDisplayAvatarUrl } from "../../api/autographs/_profile-payload";
import {
  buildAutographProfileDescription,
  buildPageMetadata,
  buildProfilePageJsonLd,
} from "../../lib/seo";
import { SiteHeader } from "../../site-header";

type ProfilePageProps = {
  params: {
    id: string;
  };
};

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const profile = await autographService.getPublicAutographProfile(params.id);

  if (!profile) {
    return buildPageMetadata({
      title: "Autograph Exchange Public Profile for Digital Keepsakes",
      description:
        "Open a teacher or student profile in Autograph Exchange to review public details, understand focus areas, and request a meaningful digital autograph keepsake.",
      path: `/profiles/${params.id}`,
    });
  }

  return buildPageMetadata({
    title: `${profile.displayName} Autograph Profile and Keepsake Request`,
    description: buildAutographProfileDescription(profile),
    path: `/profiles/${params.id}`,
    keywords: [profile.role, ...(profile.subjects ?? []), ...(profile.interests ?? [])],
  });
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const [profile, session] = await Promise.all([
    autographService.getPublicAutographProfile(params.id),
    auth(),
  ]);

  if (!profile) {
    notFound();
  }

  const viewerId = session?.user?.id;
  const viewer = viewerId
    ? {
        id: viewerId,
        email: session?.user?.email ?? null,
      }
    : null;
  const myProfile = viewerId
    ? (await autographService.listAutographProfiles()).find((item) => item.userId === viewerId)
    : null;

  const displayProfile = withDisplayAvatarUrl(profile);

  return (
    <main className="site-shell">
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildProfilePageJsonLd(displayProfile)) }}
      />
      <AutographProfileShowcase
        profile={displayProfile}
        viewer={viewer}
        canEdit={myProfile?.id === profile.id}
        viewerHasProfile={Boolean(myProfile)}
      />
    </main>
  );
}
