# Persistence Adapters

Autograph Exchange is database-neutral by design.

The reusable packages do not require:

- Supabase
- Prisma
- PostgreSQL
- MongoDB
- file storage
- any specific ORM

Instead, `@autograph-exchange/core` defines the `AutographStorage` port and the host implements it.

## Best option when the host already has a generic module store

Use `createModuleAutographStorage(...)`.

This is the cleanest migration path when a host already has `list/create/update` primitives and does not want a special-case autograph database layer.

## Example adapters

- `packages/autograph-core/examples/supabase-storage.ts`
- `packages/autograph-core/examples/prisma-storage.ts`
- `packages/autograph-core/examples/rest-storage.ts`

## Recommendation

- Use a host-native persistence adapter in production.
- Use the file adapter only for local standalone development or demos.
- Keep the feature package unaware of the actual database vendor.
