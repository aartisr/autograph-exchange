"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import { AutographExchangeFeature } from "@autograph-exchange/feature";

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
      <header className="site-header">
        <div className="site-brand">
          <p className="site-kicker">Standalone Site</p>
          <h1 className="site-title">Autograph Exchange</h1>
          <p className="site-copy">A calmer, friendlier way to ask for a meaningful autograph, reply with care, and keep each signed note easy to revisit.</p>
        </div>
        <div className="site-auth-actions">
          {viewer ? (
            <>
              <span className="site-copy">{viewer.name ?? viewer.email}</span>
              <button type="button" className="site-auth-button" onClick={() => void signOut({ callbackUrl: "/" })}>
                Sign out
              </button>
            </>
          ) : (
            <a href="/sign-in" className="site-auth-link">
              Sign in
            </a>
          )}
        </div>
      </header>

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
