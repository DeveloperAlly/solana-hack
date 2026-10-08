-- Posts get a revision counter. Every change (edit, approve, polish, undo) updates only the revision it read
-- and bumps it, so a stale request (another tab, a slow model call) is rejected instead of overwriting newer text.
alter table public.posts add column if not exists rev integer not null default 0;
