import type { Metadata } from "next";
import { AutographProfileDirectory } from "@aartisr/autograph-feature/profile-components";
import { autographService } from "../api/autographs/_service";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Autograph Exchange Profiles for Teachers and Students",
  description:
    "Browse teacher and student profiles in Autograph Exchange, discover focus areas, and open a profile to request a meaningful autograph.",
  path: "/profiles",
  keywords: ["teacher profiles", "student profiles", "autograph profile directory"],
});

export const dynamic = "force-dynamic";

export default async function ProfilesPage() {
  const profiles = await autographService.listPublicAutographProfiles();

  return (
    <main className="site-shell">
      <AutographProfileDirectory profiles={profiles} />
    </main>
  );
}
