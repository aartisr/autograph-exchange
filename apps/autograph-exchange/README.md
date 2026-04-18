# Autograph Exchange

This workspace app is the standalone website for the Autograph Exchange project.

## Purpose

- run `Autograph Exchange` as its own website
- keep the feature generic and reusable
- let other websites consume the same shared packages without duplicating logic

## Shared layers

This app consumes:

- `@aartisr/autograph-feature`
- `@aartisr/autograph-contract`
- `@aartisr/autograph-core`

## Local auth

The standalone site uses a lightweight `next-auth` credentials flow so it can run independently with no external identity provider.

For local development, the app auto-generates a stable fallback auth secret so `npm run dev` works out of the box.

For production or shared environments, set one of:

- `AUTH_SECRET`
- `NEXTAUTH_SECRET`

Production runtime should always provide a real secret. The fallback is only there to keep local development and framework builds friction-free.

## Local storage

The standalone site uses a file-backed storage adapter at:

- `.data/autograph-exchange.json`

This keeps the standalone app generic for local use while the core feature remains storage-agnostic.

On serverless platforms such as Vercel, the file adapter automatically falls back to a writable temporary directory under `/tmp`, so the app can still run without filesystem errors.

Important note:

- `/tmp` on Vercel is ephemeral and is not a durable production database
- for persistent production data, provide a real storage adapter or set:
  - `AUTOGRAPH_DATA_DIR`
  - `AUTOGRAPH_DATA_FILE`

## Persistence drivers

The standalone app resolves persistence entirely from environment variables.

Supported drivers:

- `file` (default)
- `supabase`

Recommended variables:

- `AUTOGRAPH_PERSISTENCE_DRIVER=file|supabase`
- `AUTOGRAPH_ENABLE_SUPABASE=true` as a convenience toggle

For Supabase:

- `AUTOGRAPH_SUPABASE_URL`
- `AUTOGRAPH_SUPABASE_KEY`
- `AUTOGRAPH_SUPABASE_SCHEMA` defaults to `public`
- `AUTOGRAPH_SUPABASE_PROFILES_TABLE` defaults to `autograph_profiles`
- `AUTOGRAPH_SUPABASE_REQUESTS_TABLE` defaults to `autograph_requests`

Fallbacks are also supported for host reuse:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

Suggested Supabase schema:

```sql
create table if not exists public.autograph_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  display_name text not null,
  role text not null check (role in ('student', 'teacher')),
  updated_at timestamptz not null default now()
);

create index if not exists autograph_profiles_user_id_idx
  on public.autograph_profiles (user_id);

create table if not exists public.autograph_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id text not null,
  requester_display_name text not null,
  requester_role text not null check (requester_role in ('student', 'teacher')),
  signer_user_id text not null,
  signer_display_name text not null,
  signer_role text not null check (signer_role in ('student', 'teacher')),
  message text not null,
  status text not null check (status in ('pending', 'signed')),
  signature_text text,
  visibility text check (visibility in ('public', 'private')),
  created_at timestamptz not null default now(),
  signed_at timestamptz
);

create index if not exists autograph_requests_requester_user_id_idx
  on public.autograph_requests (requester_user_id);

create index if not exists autograph_requests_signer_user_id_idx
  on public.autograph_requests (signer_user_id);
```

A ready-to-run copy of that schema is also checked in at:

- `apps/autograph-exchange/supabase/migrations/001_autograph_exchange.sql`

At runtime, the standalone app logs its active persistence driver once per server process in this shape:

```text
[autograph-exchange] persistence { driver: "supabase", details: { ... } }
```

The log intentionally redacts secrets and only prints safe connection metadata.
