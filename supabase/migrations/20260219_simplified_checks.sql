-- Simplified schema: one row per checker run, enough to replay the main UI.
-- Safe to run on a fresh Neon DB or after dropping legacy tables (see bottom).

create extension if not exists "pgcrypto";

create table if not exists public.checks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  student_text text not null,
  topic_text text,
  mode text not null check (mode in ('practice', 'test')),
  status text not null default 'ok' check (status in ('ok', 'too_short', 'error')),
  feedback jsonb not null default '{}'::jsonb
);

create index if not exists idx_checks_created_at_desc
  on public.checks (created_at desc);

comment on table public.checks is 'One English check: student input + AI feedback JSON for replay in the checker UI.';
comment on column public.checks.feedback is 'Same shape as POST /api/check feedback (mistakes, overallScore, topicFeedback, mode, status, topicText, …).';

-- Legacy tables from earlier experiments (ignore errors if already gone)
drop table if exists public.ai_feedback;
drop table if exists public.writing_submissions;
