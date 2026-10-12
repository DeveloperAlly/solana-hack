-- Journey J3 Edit (issue #95): an owner's rewording of a fact read from a source is stored as the owner's own statement
-- (trust owner_answer, no quote: ADR-011 never pairs an owner's wording with a source's quote), linked to the fact it
-- replaced. The link keeps it apart from interview answers (saveAnswer replaces only rows with no edited_from) and from
-- the source (removing a source keeps the owner's edits, which no longer depend on it). No foreign key on purpose: the
-- replaced fact can be deleted with its source, and the edit must stay marked as an edit after that (a SET NULL would
-- turn it into an interview row that the next answer save deletes; Codex review on PR #96). Additive, safe to re-run.
-- Apply before deploying the Worker that reads it (saveAnswer filters on edited_from).
alter table public.evidence add column if not exists edited_from uuid;
