import type { ReactNode } from "react";
import { buildNoIndexMetadata } from "../lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Sign In to Autograph Exchange Private Keepsake Workspace",
  description:
    "Use the protected Autograph Exchange sign-in page to access private autograph requests, profile tools, and keepsake messages tied to your account.",
  path: "/sign-in",
});

export default function SignInLayout({ children }: { children: ReactNode }) {
  return children;
}
