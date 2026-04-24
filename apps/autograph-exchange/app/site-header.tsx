"use client";

import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

function navClass(isActive: boolean): string {
  return `site-nav-link${isActive ? " is-active" : ""}`;
}

export function SiteHeader() {
  const { data: session } = useSession();
  const pathname = usePathname() ?? "/";
  const viewer = session?.user;
  const viewerLabel = viewer?.name ?? viewer?.email ?? "Signed in";
  const isHome = pathname === "/";
  const isProfiles = pathname.startsWith("/profiles");
  const isAdmin = pathname.startsWith("/admin");

  return (
    <header className="site-header" aria-label="Autograph Exchange header">
      <a className="site-brand-link" href="/" aria-label="Autograph Exchange home">
        <span className="site-brand-mark" aria-hidden="true">
          AE
        </span>
        <span className="site-brand-copy">
          <span className="site-kicker">Digital keepsake workspace</span>
          <span className="site-title">Autograph Exchange</span>
          <span className="site-copy site-header-copy">Ask, sign, and revisit meaningful notes.</span>
        </span>
      </a>

      <nav className="site-nav" aria-label="Primary navigation">
        <a className={navClass(isHome)} aria-current={isHome ? "page" : undefined} href="/">
          Exchange
        </a>
        <a className={navClass(isProfiles)} aria-current={isProfiles ? "page" : undefined} href="/profiles">
          Profiles
        </a>
        {viewer ? (
          <a className={navClass(isAdmin)} aria-current={isAdmin ? "page" : undefined} href="/admin/profiles">
            Admin
          </a>
        ) : null}
      </nav>

      <div className="site-auth-actions">
        {viewer ? (
          <>
            <a className="site-primary-action" href="/#autograph-request-composer">
              Ask for autograph
            </a>
            <span className="site-user-chip" title={viewerLabel}>
              {viewerLabel}
            </span>
            <button type="button" className="site-auth-button" onClick={() => void signOut({ callbackUrl: "/" })}>
              Sign out
            </button>
          </>
        ) : (
          <a href="/sign-in" className="site-primary-action">
            Start exchanging
          </a>
        )}
      </div>
    </header>
  );
}
