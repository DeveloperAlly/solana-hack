-- Journey J3 Edit (issue #95): an owner's rewording of a fact read from a source is stored as the owner's own statement
-- (trust owner_answer, no quote: ADR-011 never pairs an owner's wording with a source's quote), linked to the fact it
-- replaced. The link keeps it apart from interview answers (saveAnswer replaces only rows with no edited_from) and from
-- the source (removing a source keeps the owner's edits, which no longer depend on it). No foreign key on purpose: the
-- replaced fact can be deleted with its source, and the edit must stay marked as an edit after that (a SET NULL would
-- turn it into an interview row that the next answer save deletes; Codex review on PR #96). Additive, safe to re-run.
-- Apply before deploying the Worker that reads it (saveAnswer filters on edited_from).
alter table public.evidence add column if not exists edited_from uuid;
-- One correction per source fact, enforced by the database so concurrent edits cannot leave two (journey.ts editFact
-- upserts on this column). NULLs stay distinct, so source facts and interview answers are unaffected.
do $$ begin
  alter table public.evidence add constraint evidence_edited_from_key unique (edited_from);
exception when duplicate_object or duplicate_table then null; end $$;
-- One version of a fact is usable at a time, enforced in the database so concurrent requests cannot break it (Codex
-- review on PR #96): saving an approved correction rejects its source fact, and approving a source fact deletes its
-- correction. Row locks order concurrent writes to the same fact, so whichever lands last decides.
create or replace function public.evidence_one_version() returns trigger language plpgsql as $$
begin
  if new.edited_from is not null and new.review_status = 'approved' then
    update public.evidence set review_status = 'rejected' where id = new.edited_from and review_status <> 'rejected';
  elsif new.edited_from is null and new.review_status = 'approved' and (tg_op = 'INSERT' or old.review_status is distinct from 'approved') then
    delete from public.evidence where edited_from = new.id;
  end if;
  return null;
end $$;
drop trigger if exists evidence_one_version on public.evidence;
create trigger evidence_one_version after insert or update of review_status, edited_from on public.evidence
  for each row execute function public.evidence_one_version();
