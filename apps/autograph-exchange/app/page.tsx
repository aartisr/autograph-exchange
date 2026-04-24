"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { AutographExchangeFeature } from "@aartisr/autograph-feature";
import { SiteHeader } from "./site-header";

export default function HomePage() {
  const { data: session, status } = useSession();
  const viewer = session?.user?.id
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      }
    : null;

  return (
    <div className="site-shell">
      <SiteHeader />

      <AutographExchangeFeature
        authStatus={status === "loading" ? "loading" : viewer ? "authenticated" : "unauthenticated"}
        viewer={viewer}
        signInHref="/sign-in"
        signInLabel="Start exchanging autographs"
        signedOutMessage="Sign in with a simple local identity to ask for autographs, reply to incoming requests, and keep your signed memories in one place."
      />
    </div>
  );
}
