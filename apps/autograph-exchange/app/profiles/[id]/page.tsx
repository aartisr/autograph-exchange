import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AutographProfileShowcase } from "@aartisr/autograph-feature/profile-components";
import { auth } from "@/auth";
import { autographService } from "../../api/autographs/_service";
import { buildPageMetadata } from "../../lib/seo";

type ProfilePageProps = {
  params: {
    id: string;
  };
};

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const profile = await autographService.getPublicAutographProfile(params.id);

  if (!profile) {
    return buildPageMetadata({
      title: "Autograph Exchange Profile",
      description:
        "Open a teacher or student profile in Autograph Exchange to request a thoughtful digital autograph.",
      path: `/profiles/${params.id}`,
    });
  }

  return buildPageMetadata({
    title: `${profile.displayName} Autograph Profile`,
    description:
      profile.bio
      || profile.headline
      || `Request a thoughtful autograph from ${profile.displayName} in Autograph Exchange.`,
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

  return (
    <main className="site-shell">
      <AutographProfileShowcase profile={profile} viewer={viewer} canEdit={myProfile?.id === profile.id} />
    </main>
  );
}
