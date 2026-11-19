-- FirstShift app state: one JSON document with optimistic versioning.
-- Only the firstshift-api edge function (service role) reads or writes it: RLS on, no policies.
create table if not exists public.fs_state (
  id text primary key,
  data jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.fs_state enable row level security;
