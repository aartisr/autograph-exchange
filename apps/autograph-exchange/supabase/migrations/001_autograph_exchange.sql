create extension if not exists pgcrypto;

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
