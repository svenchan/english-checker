-- Anonymous per-browser check throttle, keyed by wc_session_id.

create table if not exists public.check_rate_limits (
  session_id text primary key,
  last_checked_at timestamptz not null
);

comment on table public.check_rate_limits is 'Last successful AI check time per guest session cookie.';
