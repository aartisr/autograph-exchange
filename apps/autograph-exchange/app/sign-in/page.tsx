"use client";

import React, { useState, useTransition } from "react";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="site-shell">
      <section className="site-form-card">
        <div className="site-brand">
          <p className="site-kicker">Generic Sign In</p>
          <h1 className="site-title">Join Autograph Exchange</h1>
          <p className="site-copy">Use a simple name and email so people can recognize you, request your autograph, and know who their signed note came from.</p>
        </div>

        <form
          className="site-form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);

            startTransition(async () => {
              const result = await signIn("credentials", {
                redirect: false,
                callbackUrl: "/",
                name,
                email,
              });

              if (!result || result.error) {
                setError("Enter a name and email to continue.");
                return;
              }

              window.location.assign(result.url ?? "/");
            });
          }}
        >
          <label className="site-label">
            Name
            <input className="site-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Asha Raman" />
          </label>
          <label className="site-label">
            Email
            <input className="site-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="asha@example.com" />
          </label>
          {error ? <p className="site-copy">{error}</p> : null}
          <button type="submit" className="site-submit" disabled={pending}>
            {pending ? "Signing in..." : "Continue"}
          </button>
        </form>
      </section>
    </div>
  );
}
