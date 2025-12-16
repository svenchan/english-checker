-- Add test_mode flag for submissions triggered from the simulated test experience
alter table if exists public.writing_submissions
  add column if not exists test_mode boolean not null default false;

-- Ensure status uses text and defaults to ok so "too_short" can be stored reliably
alter table if exists public.writing_submissions
  alter column status type text using status::text;

alter table if exists public.writing_submissions
  alter column status set default 'ok';

-- Allow enum-based implementations to append the new status without failing deployments
do
$$
begin
  if exists (select 1 from pg_type where typname = 'writing_submission_status') then
    begin
      alter type public.writing_submission_status add value if not exists 'too_short';
    exception
      when duplicate_object then null;
    end;
  end if;
end;
$$;

-- Normalize constraint when the table uses a CHECK on status
alter table if exists public.writing_submissions
  drop constraint if exists writing_submissions_status_check;

alter table if exists public.writing_submissions
  add constraint writing_submissions_status_check
  check (status in ('ok', 'error', 'too_short'));

-- Improve filtering speed for teacher list views
create index if not exists idx_writing_submissions_test_mode_created_at
  on public.writing_submissions (test_mode, created_at desc);
