"use client";

import { AutographExchangeFeature } from "../../AutographExchangeFeature";

export default function ReactRouterAutographPageExample() {
  const authStatus = "authenticated" as const;
  const viewer = {
    id: "router-user-1",
    name: "Router Host User",
    email: "router@example.com",
  };

  return (
    <AutographExchangeFeature
      authStatus={authStatus}
      viewer={viewer}
      signInHref="/login"
      renderShell={(content) => <main className="host-page-shell">{content}</main>}
      onEvent={(event) => {
        console.debug("react-router-host autograph event", event);
      }}
    />
  );
}
