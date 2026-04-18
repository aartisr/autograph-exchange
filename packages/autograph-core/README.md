# `@autograph-exchange/core`

Reusable domain logic for Autograph Exchange.

## Design

`@autograph-exchange/core` is intentionally persistence-neutral.

- The package owns autograph rules and state transitions.
- The host owns persistence.
- The host decides whether storage is backed by PostgreSQL, Supabase, Prisma, MongoDB, REST, files, or any other system.

## Recommended Integration

Implement the explicit `AutographStorage` interface:

```ts
import { createAutographService, type AutographStorage } from "@autograph-exchange/core";

const storage: AutographStorage = {
  listProfiles: async () => [],
  saveProfile: async (profile) => ({ id: "profile-1", ...profile }),
  listRequests: async () => [],
  createRequest: async (request) => ({ id: "request-1", ...request }),
  updateRequest: async (requestId, patch) => ({
    id: requestId,
    requesterUserId: "user-1",
    requesterDisplayName: "Requester",
    requesterRole: "student",
    signerUserId: "user-2",
    signerDisplayName: "Signer",
    signerRole: "teacher",
    message: "Thanks for everything.",
    status: "signed",
    createdAt: new Date().toISOString(),
    ...patch,
  }),
};

export const autographService = createAutographService(storage);
```

## Generic Module Store Bridge

If the host already has a generic module store with `list/create/update`, use `createModuleAutographStorage(...)`:

```ts
import { createAutographService, createModuleAutographStorage } from "@autograph-exchange/core";

const service = createAutographService(createModuleAutographStorage(hostModuleStore));
```

This keeps the core plug-and-play while still honoring the host's existing persistence layer.

## Example Adapters

Reference adapters live in `examples/`:

- `supabase-storage.ts`
- `prisma-storage.ts`
- `rest-storage.ts`
