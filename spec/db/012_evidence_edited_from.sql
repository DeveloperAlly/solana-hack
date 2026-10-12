-- Journey J3 Edit (issue #95): an owner's rewording of a fact read from a source is stored as the owner's own statement
-- (trust owner_answer, no quote: ADR-011 never pairs an owner's wording with a source's quote), linked to the fact it
-- replaced. The link keeps it apart from interview answers (saveAnswer replaces only rows with no edited_from) and from
-- the source (removing a source keeps the owner's edits, which no longer depend on it). Additive and safe to re-run.
alter table public.evidence add column if not exists edited_from uuid references public.evidence(id) on delete set null;
