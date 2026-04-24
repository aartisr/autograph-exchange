import type { Metadata } from "next";
import { AutographProfileAdminPanel } from "@aartisr/autograph-feature/profile-components";
import { auth } from "@/auth";
import { withDisplayAvatarUrls } from "../../api/autographs/_profile-payload";
import { autographService } from "../../api/autographs/_service";
import { isAutographAdminUserId } from "../../api/autographs/_session";
import { buildNoIndexMetadata } from "../../lib/seo";
import { SiteHeader } from "../../site-header";

export const metadata: Metadata = buildNoIndexMetadata({
  title: "Autograph Exchange Profile Administration Workspace",
  description:
    "Restricted Autograph Exchange administration workspace for creating, reviewing, and updating teacher and student profile details before they appear publicly.",
  path: "/admin/profiles",
});

export default async function AdminProfilesPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId || !isAutographAdminUserId(userId)) {
    return (
      <main className="site-shell">
        <SiteHeader />
        <section className="site-form-card">
          <p className="site-kicker">Admin</p>
          <h1 className="site-title">Profile admin is restricted</h1>
          <p className="site-copy">Sign in with an email listed in AUTOGRAPH_ADMIN_EMAILS to manage teacher and student profiles.</p>
          <a className="site-auth-link" href="/sign-in">
            Sign in
          </a>
        </section>
      </main>
    );
  }

  const profiles = withDisplayAvatarUrls(await autographService.listAutographProfiles());

  return (
    <main className="site-shell">
      <SiteHeader />
      <AutographProfileAdminPanel initialProfiles={profiles} />
    </main>
  );
}
