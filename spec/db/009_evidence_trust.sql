-- Slice 1a (issue #57): evidence trust classes and owner review, so the kit snapshot and the post claims gate can
-- use allow-lists instead of the old deny-list on origin (build plan v2 §5; ADR-011, proposed).
-- trust: where a fact comes from. owned = the brand's own site, uploads and exports; third_party = pages the brand does
--   not control (search results, competitor pages); owner_answer = an interview answer; assumption = a labelled guess.
-- review_status: the owner's decision on the fact. proposed = waiting; approved = may enter a kit and back a post;
--   rejected = never used. Named review_status, not status, because architecture §3 reserves an evidential status
--   (evidenced / inferred / answered / rejected) for the coverage map (#34).
-- origin stays for compatibility with readers that still use it.
-- Must be applied before the Worker that writes and filters these columns is deployed. Safe to re-run.
alter table public.evidence add column if not exists trust text;
alter table public.evidence add column if not exists review_status text;
alter table public.sources add column if not exists kind text not null default 'site';

-- Backfill: every existing row was written by code that only produced the brand's own pages ('source'), owner answers
-- and assumptions, all of which the old deny-list already let through (or labelled), so each keeps its standing.
update public.evidence set trust = case origin when 'source' then 'owned' when 'owner_answer' then 'owner_answer' else 'assumption' end where trust is null;
update public.evidence set review_status = 'approved' where review_status is null;

-- A Worker deployed before this migration's code still inserts rows without the new columns. Derive them from origin
-- the same way as the backfill, so no row is ever left without a trust class or review decision.
create or replace function public.evidence_trust_default() returns trigger language plpgsql as $$
begin
  if new.trust is null then
    new.trust := case new.origin when 'source' then 'owned' when 'owner_answer' then 'owner_answer' else 'assumption' end;
  end if;
  if new.review_status is null then
    new.review_status := case when new.trust = 'third_party' then 'proposed' else 'approved' end;
  end if;
  return new;
end $$;
drop trigger if exists evidence_trust_default on public.evidence;
create trigger evidence_trust_default before insert on public.evidence for each row execute function public.evidence_trust_default();

alter table public.evidence alter column trust set not null;
alter table public.evidence alter column review_status set not null;
do $$ begin
  alter table public.evidence add constraint evidence_trust_check check (trust in ('owned','third_party','owner_answer','assumption'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.evidence add constraint evidence_review_status_check check (review_status in ('proposed','approved','rejected'));
exception when duplicate_object then null; end $$;
create index if not exists evidence_brand_review on public.evidence(brand_id, review_status);
