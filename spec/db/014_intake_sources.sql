-- Intake sources (R9 on issue #38; issues #33 and #35): competitor candidates for the positioning step. Next free number
-- after 011 (fact extraction, PR #91), 012 (issue #34) and 013 (Create); depends on 010 (workflow_defs) and 011.
-- Documents, social exports and web search need no schema change: they are sources whose text is stored in
-- sources.source_text (008) with their kind (009), and a source without an address keeps url '' and is named by its
-- title, as pasted text is (web/worker/engine/readers.ts READER_INPUTS.paste).
-- Must be applied before POST /api/brands/:id/competitors can start a run: without this row it answers 503 before
-- anything is written (web/worker/engine/api.ts activeDef). Safe to re-run. Only the Worker reads and writes these
-- tables, with the secret key; RLS is on with no policies, as in 001.

-- find_competitors v1: read pages similar to the brand's website through Exa (web/worker/sources/search.ts
-- readCompetitors), then save each as a competitor_page source (third-party; web/worker/intake.ts
-- saveCompetitorCandidates). No model step. Mirrored in web/worker/engine/seed.ts FIND_COMPETITORS for tests, which
-- fail if the two drift apart.
insert into public.workflow_defs (id, version, spec, status) values ('find_competitors', 1, $spec${"id":"find_competitors","version":1,"title":"Find competitor candidates","concurrency":"supersede","retries":{"limit":2,"delay":"5 seconds","backoff":"exponential"},"steps":[{"id":"read","type":"fetch","label":"Looking for similar companies","reader":"$input.reader","args":"$input.args","maxChars":20000,"maxBytes":60000},{"id":"save","type":"write","label":"Saving the candidates","op":"save_competitor_candidates","args":{"read":"$steps.read"}}],"output":"$steps.save"}$spec$::jsonb, 'active')
on conflict (id, version) do nothing;
