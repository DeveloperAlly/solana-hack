-- Intake sources (R9 on issue #38; issues #33 and #35): documents, the owner's own social exports and web research,
-- added as sources whose text is stored when they are added and read into fact extraction from there. Next free number
-- after 011 (fact extraction, PR #91), 012 (issue #34) and 013 (Create); depends on 010 (workflow_defs) and 011.
-- Must be applied before the Worker that writes these columns is deployed: the upload, social and competitor routes
-- (web/worker/intake.ts) insert sources with no url, and POST /api/brands/:id/competitors starts a find_competitors
-- run. Safe to re-run. Only the Worker reads and writes these tables, with the secret key; RLS is on with no policies,
-- as in 001.

-- An uploaded document, a social export and a web search have no single address, so a source no longer needs a url.
-- name is what such a source is called instead (the file name, "X export (412 items)", "Web search: JamJam"). Every
-- source keeps one or the other, so the links list can always say what it is.
alter table public.sources alter column url drop not null;
alter table public.sources add column if not exists name text;
do $$ begin
  alter table public.sources add constraint sources_url_or_name_check check (url is not null or name is not null);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.sources add constraint sources_name_check check (name is null or char_length(name) <= 200);
exception when duplicate_object then null; end $$;

-- Competitor candidates (issue #35): one find_competitors run reads pages similar to the brand's website through Exa
-- (web/worker/sources/search.ts readCompetitors) and saves each as a competitor_page source (third-party). The
-- definition is mirrored in web/worker/engine/seed.ts for tests, which fail if the two drift apart.
insert into public.workflow_defs (id, version, spec, status) values ('find_competitors', 1, $spec$__FIND_COMPETITORS__$spec$::jsonb, 'active')
on conflict (id, version) do nothing;
