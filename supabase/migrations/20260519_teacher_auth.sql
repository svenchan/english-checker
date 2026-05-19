-- Teacher accounts and server-side sessions for /teacher auth.

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null
);

create table if not exists public.sessions (
  id uuid primary key,
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  expires_at timestamptz not null
);

create index if not exists idx_sessions_expires_at on public.sessions (expires_at);
