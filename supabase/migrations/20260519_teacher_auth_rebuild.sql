-- Replace legacy teachers/sessions tables (empty) with the auth schema.

drop table if exists public.submissions;
drop table if exists public.classes;
drop table if exists public.sessions;
drop table if exists public.teachers;

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null
);

create table public.sessions (
  id uuid primary key,
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  expires_at timestamptz not null
);

create index if not exists idx_sessions_expires_at on public.sessions (expires_at);
