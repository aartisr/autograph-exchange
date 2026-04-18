# Host Embedding Guide

Autograph Exchange is designed to embed cleanly into different host applications without taking over the host's auth or persistence.

## Host responsibilities

- Resolve the current user
- Decide whether the viewer is authenticated
- Provide API endpoints or a custom fetcher
- Provide persistence through the host backend
- Optionally log telemetry with `onEvent`

## Smallest Next.js integration

```tsx
"use client";

import { AutographExchangeFeature } from "@aartisr/autograph-feature";

export default function AutographPage() {
  return (
    <AutographExchangeFeature
      authStatus="authenticated"
      viewer={{
        id: "user-123",
        name: "Asha Raman",
        email: "asha@example.com",
      }}
      onEvent={(event) => {
        console.log("autograph event", event);
      }}
    />
  );
}
```

## Generic host shell pattern

- Use the host session system to create `authStatus` and `viewer`
- Mount `AutographExchangeFeature`
- Point it at host APIs with `api.fetcher` or `api.endpoints`
- Wrap it with host shell chrome using `renderShell`

## Examples

- `packages/autograph-feature/examples/nextjs`
- `packages/autograph-feature/examples/react-router`
- `packages/autograph-feature/examples/custom-fetcher`
