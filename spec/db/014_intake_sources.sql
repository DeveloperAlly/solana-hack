-- Intake sources (R9 on issue #38; issues #33 and #35): one web search per brand held by the database, competitor
-- candidates for the positioning step with their set replaced atomically by each run, and the find_competitors
-- definition. Next free number
-- after 011 (fact extraction, PR #91), 012 (issue #34) and 013 (Create); depends on 010 (workflow_defs) and 011.
-- Documents, social exports and web search add no columns: they are sources whose text is stored in
-- sources.source_text (008) with their kind (009), and a source without an address keeps url '' and is named by its
-- title, as pasted text is (web/worker/engine/readers.ts READER_INPUTS.paste).
-- Must be applied before the Worker that calls these functions is deployed: a web search (extract_facts with reader
-- search) reserves its source through reserve_search_source, and POST /api/brands/:id/competitors needs the
-- find_competitors row (without it, it answers 503 before anything is written; web/worker/engine/api.ts activeDef). Safe to re-run. Only the Worker reads and writes these
-- tables, with the secret key; RLS is on with no policies, as in 001.

-- One web search per brand at a time (issue #35; Codex review on PR #100): the database holds the rule, so two requests
-- at once cannot both start a paid search. A failed search does not hold the place. reserve_search_source inserts the
-- pending search_result source, or does nothing when the brand already has one, and returns its id or null. On
-- 2026-10-12 the live database held no sources, so the index cannot meet existing duplicates
-- (https://github.com/DeveloperAlly/solana-hack/issues/38#issuecomment-6126851174).
create unique index if not exists sources_one_search on public.sources(brand_id) where kind = 'search_result' and status <> 'failed';
create or replace function public.reserve_search_source(p_brand uuid, p_title text)
returns uuid language plpgsql security invoker set search_path = public as $fn$
declare
  v_id uuid;
begin
  insert into public.sources (brand_id, url, kind, status, title) values (p_brand, '', 'search_result', 'pending', p_title)
  on conflict (brand_id) where kind = 'search_result' and status <> 'failed' do nothing
  returning id into v_id;
  return v_id;
end $fn$;
revoke all on function public.reserve_search_source(uuid, text) from public, anon, authenticated;
grant execute on function public.reserve_search_source(uuid, text) to service_role;

-- Competitor candidates are replaced as one set (Codex review on PR #100): each run's candidates take the place of the
-- brand's previous ones in one transaction, so GET /competitors always lists the latest set, never an accumulation and
-- never a half-written one. Only the brand's latest find_competitors run writes: runs are ordered by (created_at, id),
-- a total order, so equal timestamps cannot both count as latest. The brand's run bookkeeping is serialised by one
-- transaction-scoped advisory lock per brand, the key spec/db/011 admit_run takes ('admit_run:' || brand): a save waits
-- for an admission in progress and the reverse, so the latest-run check and the write see the same runs, and two
-- overlapping saves cannot interleave. Each call takes that one lock and no other, so the two functions cannot
-- deadlock. Rows are keyed by brand and address (web/worker/intake.ts), so a retried save writes the same set.
-- Returns false when this run is not the latest (nothing written).
create or replace function public.replace_competitor_candidates(p_brand uuid, p_run uuid, p_rows jsonb)
returns boolean language plpgsql security invoker set search_path = public as $fn$
declare
  v_latest uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('admit_run:' || p_brand::text, 0));
  if not exists (select 1 from public.runs where id = p_run and brand_id = p_brand and kind = 'find_competitors') then
    raise exception 'run % is not a find_competitors run of brand %', p_run, p_brand;
  end if;
  select id into v_latest from public.runs where brand_id = p_brand and kind = 'find_competitors'
  order by created_at desc, id desc limit 1;
  if v_latest <> p_run then
    return false;
  end if;
  delete from public.sources
  where brand_id = p_brand and kind = 'competitor_page'
    and id not in (select (x->>'id')::uuid from jsonb_array_elements(p_rows) x);
  insert into public.sources (id, brand_id, url, title, kind, status, source_text, text_excerpt, fetched_at)
  select (x->>'id')::uuid, p_brand, x->>'url', x->>'title', 'competitor_page', 'read', x->>'source_text', x->>'text_excerpt', now()
  from jsonb_array_elements(p_rows) x
  on conflict (id) do update set url = excluded.url, title = excluded.title, source_text = excluded.source_text,
    text_excerpt = excluded.text_excerpt, fetched_at = excluded.fetched_at
    where public.sources.brand_id = p_brand and public.sources.kind = 'competitor_page';
  return true;
end $fn$;
revoke all on function public.replace_competitor_candidates(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.replace_competitor_candidates(uuid, uuid, jsonb) to service_role;

-- find_competitors v1: read pages similar to the brand's website through Exa (web/worker/sources/search.ts
-- readCompetitors), then save each as a competitor_page source (third-party; web/worker/intake.ts
-- saveCompetitorCandidates). No model step. Mirrored in web/worker/engine/seed.ts FIND_COMPETITORS for tests, which
-- fail if the two drift apart.
insert into public.workflow_defs (id, version, spec, status) values ('find_competitors', 1, $spec${"id":"find_competitors","version":1,"title":"Find competitor candidates","concurrency":"supersede","retries":{"limit":2,"delay":"5 seconds","backoff":"exponential"},"steps":[{"id":"read","type":"fetch","label":"Looking for similar companies","reader":"$input.reader","args":"$input.args","maxChars":20000,"maxBytes":60000,"metered":1},{"id":"save","type":"write","label":"Saving the candidates","op":"save_competitor_candidates","args":{"read":"$steps.read"}}],"output":"$steps.save"}$spec$::jsonb, 'active')
on conflict (id, version) do nothing;
