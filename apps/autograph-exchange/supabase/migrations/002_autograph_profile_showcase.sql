alter table autograph_profiles
  add column if not exists headline text,
  add column if not exists bio text,
  add column if not exists avatar_url text,
  add column if not exists affiliation text,
  add column if not exists location text,
  add column if not exists subjects text[] not null default '{}',
  add column if not exists interests text[] not null default '{}',
  add column if not exists signature_prompt text;
