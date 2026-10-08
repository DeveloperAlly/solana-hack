-- Posts get a 'registering' state so a registration is claimed before it is sent to Solana (no double writes).
alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts add constraint posts_status_check
  check (status in ('drafted','approved','registering','registered','failed'));
