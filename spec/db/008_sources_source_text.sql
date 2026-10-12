-- The full readable text of each source, as the quotes on its evidence were checked against (issue #31). Stored so
-- any quote can be re-checked later; text_excerpt (the first 2,000 characters) stays for existing readers.
-- Must be applied before the Worker that writes it is deployed: the ingest update names this column.
alter table public.sources add column if not exists source_text text;
