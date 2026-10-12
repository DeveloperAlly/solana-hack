-- Intake sources (R9 on issue #38; issues #33 and #35): one web search per brand held by the database, competitor
-- candidates for the positioning step (written per run, read from the latest done run), and the find_competitors
-- definition. Numbered 012, the next free number after 011 (fact extraction, PR #91), so spec/db has no gap (the
-- migration runner, PR #87, refuses gaps); first written as 014. Depends on 010 (workflow_defs) and 011.
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
-- The place is self-healing (Codex review on PR #100): a reservation can be left pending with no run to finish it (the
-- reply carrying its id was lost, or the start failed after it), and a Worker cleanup cannot cover a lost reply. So,
-- under the brand's advisory lock (the key spec/db/011 admit_run takes), a pending search_result source is reclaimed
-- (marked failed, which frees the index) when the run that owns it has failed or been superseded, or when no run owns
-- it and it is older than two minutes. A run owns its source through its input (runs.input sourceId, written by
-- web/worker/engine/api.ts start() right after the reservation), so no second pointer is kept that could disagree.
-- Two minutes: between the reservation and that input write there are two database calls in one request; two minutes
-- is far longer than they take, and short enough that an owner who retries soon after a failure can search again.
create or replace function public.reserve_search_source(p_brand uuid, p_title text)
returns uuid language plpgsql security invoker set search_path = public as $fn$
declare
  v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('admit_run:' || p_brand::text, 0));
  update public.sources s set status = 'failed', error = 'the web search did not start; search again'
  where s.brand_id = p_brand and s.kind = 'search_result' and s.status = 'pending'
    and (
      exists (select 1 from public.runs r where r.brand_id = p_brand and r.input->>'sourceId' = s.id::text and r.status in ('failed','superseded'))
      or (s.created_at < now() - interval '2 minutes'
          and not exists (select 1 from public.runs r where r.brand_id = p_brand and r.input->>'sourceId' = s.id::text))
    );
  insert into public.sources (brand_id, url, kind, status, title) values (p_brand, '', 'search_result', 'pending', p_title)
  on conflict (brand_id) where kind = 'search_result' and status <> 'failed' do nothing
  returning id into v_id;
  return v_id;
end $fn$;
revoke all on function public.reserve_search_source(uuid, text) from public, anon, authenticated;
grant execute on function public.reserve_search_source(uuid, text) to service_role;

-- Competitor candidates (Codex review on PR #100): no save decides whether to keep or discard a set, since any such
-- decision depends on how another run ends. Instead:
-- - Write: each find_competitors run inserts its own candidates as competitor_page sources tagged with its run_id. Rows
--   are keyed by run and address (web/worker/intake.ts), so a retried save writes nothing new; a save never removes
--   another run's rows that could still be shown.
-- - Read: competitor_candidates(brand) returns the candidates of the brand's latest find_competitors run whose status
--   is 'done', by (created_at, id), a total order. It is the only read path (GET /api/brands/:id/competitors). A run
--   that is reserved, running, failed or superseded is never shown, and never hides an older done set.
-- - Cleanup: after inserting, a save prunes the rows of runs older than the brand's latest done run. Those rows can
--   never be shown again (a later done run is always newer), so pruning changes no read; it keeps the table to one
--   visible set plus the sets of runs not yet done, rather than every set a brand ever fetched.
alter table public.sources add column if not exists run_id uuid references public.runs(id) on delete cascade;
create index if not exists sources_competitor_run on public.sources(brand_id, run_id) where kind = 'competitor_page';

create or replace function public.save_competitor_candidates(p_brand uuid, p_run uuid, p_rows jsonb)
returns int language plpgsql security invoker set search_path = public as $fn$
declare
  v_inserted int;
  v_done_at timestamptz;
  v_done_id uuid;
begin
  if not exists (select 1 from public.runs where id = p_run and brand_id = p_brand and kind = 'find_competitors') then
    raise exception 'run % is not a find_competitors run of brand %', p_run, p_brand;
  end if;
  insert into public.sources (id, brand_id, run_id, url, title, kind, status, source_text, text_excerpt, fetched_at)
  select (x->>'id')::uuid, p_brand, p_run, x->>'url', x->>'title', 'competitor_page', 'read', x->>'source_text', x->>'text_excerpt', now()
  from jsonb_array_elements(p_rows) x
  on conflict (id) do nothing;
  get diagnostics v_inserted = row_count;
  select d.created_at, d.id into v_done_at, v_done_id from public.runs d
  where d.brand_id = p_brand and d.kind = 'find_competitors' and d.status = 'done'
  order by d.created_at desc, d.id desc limit 1;
  if v_done_id is not null then
    delete from public.sources s
    using public.runs old
    where s.brand_id = p_brand and s.kind = 'competitor_page' and old.id = s.run_id
      and (old.created_at, old.id) < (v_done_at, v_done_id);
  end if;
  return v_inserted;
end $fn$;
revoke all on function public.save_competitor_candidates(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.save_competitor_candidates(uuid, uuid, jsonb) to service_role;

create or replace function public.competitor_candidates(p_brand uuid)
returns setof public.sources language sql stable security invoker set search_path = public as $fn$
  select s.* from public.sources s
  where s.brand_id = p_brand and s.kind = 'competitor_page'
    and s.run_id = (
      select r.id from public.runs r
      where r.brand_id = p_brand and r.kind = 'find_competitors' and r.status = 'done'
      order by r.created_at desc, r.id desc limit 1)
  order by s.created_at, s.id;
$fn$;
revoke all on function public.competitor_candidates(uuid) from public, anon, authenticated;
grant execute on function public.competitor_candidates(uuid) to service_role;

-- find_competitors v1: read pages similar to the brand's website through Exa (web/worker/sources/search.ts
-- readCompetitors), then save each as a competitor_page source (third-party; web/worker/intake.ts
-- saveCompetitorCandidates). No model step. Mirrored in web/worker/engine/seed.ts FIND_COMPETITORS for tests, which
-- fail if the two drift apart.
insert into public.workflow_defs (id, version, spec, status) values ('find_competitors', 1, $spec${"id":"find_competitors","version":1,"title":"Find competitor candidates","concurrency":"supersede","retries":{"limit":2,"delay":"5 seconds","backoff":"exponential"},"steps":[{"id":"read","type":"fetch","label":"Looking for similar companies","reader":"$input.reader","args":"$input.args","maxChars":20000,"maxBytes":60000,"metered":1},{"id":"save","type":"write","label":"Saving the candidates","op":"save_competitor_candidates","args":{"read":"$steps.read"}}],"output":"$steps.save"}$spec$::jsonb, 'active')
on conflict (id, version) do nothing;
