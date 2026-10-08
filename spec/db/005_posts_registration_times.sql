-- When a registration was sent (to reconcile one whose outcome was unknown) and when it completed (ledger order).
alter table public.posts add column if not exists registering_at timestamptz;
alter table public.posts add column if not exists registered_at timestamptz;
-- Existing registered rows: approval time is the closest record of when they were registered.
update public.posts set registered_at = approved_at where status = 'registered' and registered_at is null;
