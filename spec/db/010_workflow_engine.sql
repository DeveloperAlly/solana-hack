-- Workflow engine (issue #32; backlog X4, X5, X14): durable runs with typed steps, definitions as data, a versioned
-- prompt library, and per-step traces. Next free number after 009_evidence_trust.sql (slice 1a, PR #63).
-- Must be applied before the Worker that reads these tables is deployed: GET /api/brands/:id reads runs for activeRun,
-- and POST /api/brands/:id/sources starts an ingest_url run. Safe to re-run.
-- Only the Worker reads and writes these tables, with the secret key; RLS is on with no policies, as in 001.

-- Engine settings, read at run start. executor: 'workflows' (Cloudflare Workflows, default) or 'inline' (single-step
-- workflows only; see web/worker/engine/executor.ts).
create table if not exists public.engine_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.engine_config (key, value) values ('executor', '"workflows"') on conflict (key) do nothing;

-- Prompt library (X5) keyed by version and hash (X14). One active version per key; a change is a new version, never
-- an edit in place (the Worker refuses a row whose hash does not match its body).
create table if not exists public.prompt_versions (
  key text not null,
  version int not null check (version > 0),
  body text not null,
  status text not null default 'active' check (status in ('draft','active','retired')),
  hash text not null,
  created_at timestamptz not null default now(),
  primary key (key, version)
);
create unique index if not exists prompt_versions_one_active on public.prompt_versions(key) where status = 'active';

-- Workflow definitions as data: typed steps (fetch, llm, code, write, map). Runs pin the version they started on.
create table if not exists public.workflow_defs (
  id text not null,
  version int not null check (version > 0),
  spec jsonb not null,
  status text not null default 'active' check (status in ('draft','active','retired')),
  created_at timestamptz not null default now(),
  primary key (id, version)
);
create unique index if not exists workflow_defs_one_active on public.workflow_defs(id) where status = 'active';

-- One row per run. progress is written once per stage; resume_at is set while paused for the model's daily limit.
create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  kind text not null,
  workflow_version int not null,
  executor text not null default 'workflows' check (executor in ('workflows','inline')),
  status text not null default 'running' check (status in ('running','paused','done','failed','superseded')),
  input jsonb not null default '{}',
  output jsonb,
  progress jsonb not null default '{}',
  resume_at timestamptz,
  error text,
  error_code int,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (kind, workflow_version) references public.workflow_defs(id, version)
);
create index if not exists runs_brand_created on public.runs(brand_id, created_at desc);
create index if not exists runs_brand_active on public.runs(brand_id, kind) where status in ('running','paused');

-- One row per attempt of a step: which prompt (key, version, hash) and model, tokens, time and outcome. Never content.
create table if not exists public.run_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  step text not null,
  attempt int not null default 1,
  type text not null check (type in ('fetch','llm','code','write','map')),
  outcome text not null check (outcome in ('ok','error','paused')),
  prompt_key text,
  prompt_version int,
  prompt_hash text,
  model text,
  tokens_in int,
  tokens_out int,
  duration_ms int not null default 0,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists run_steps_run on public.run_steps(run_id, created_at);

alter table public.engine_config enable row level security;
alter table public.prompt_versions enable row level security;
alter table public.workflow_defs enable row level security;
alter table public.runs enable row level security;
alter table public.run_steps enable row level security;

-- The one write per stage: a step's trace row and the run's new state together. The run is changed only while it is
-- running or paused, so a superseded or finished run is never revived; returns whether it was.
create or replace function public.record_run_step(p_run uuid, p_step jsonb, p_patch jsonb)
returns boolean language plpgsql security invoker set search_path = public as $fn$
begin
  if p_step is not null and jsonb_typeof(p_step) = 'object' then
    insert into public.run_steps (run_id, step, attempt, type, outcome, prompt_key, prompt_version, prompt_hash, model, tokens_in, tokens_out, duration_ms, error)
    select p_run, x.step, coalesce(x.attempt, 1), x.type, x.outcome, x.prompt_key, x.prompt_version, x.prompt_hash, x.model, x.tokens_in, x.tokens_out, coalesce(x.duration_ms, 0), x.error
    from jsonb_to_record(p_step) as x(step text, attempt int, type text, outcome text, prompt_key text, prompt_version int, prompt_hash text, model text, tokens_in int, tokens_out int, duration_ms int, error text);
  end if;
  update public.runs set
    status = coalesce(p_patch->>'status', status),
    progress = coalesce(p_patch->'progress', progress),
    output = case when p_patch ? 'output' then p_patch->'output' else output end,
    resume_at = case when p_patch ? 'resume_at' then (p_patch->>'resume_at')::timestamptz else resume_at end,
    error = case when p_patch ? 'error' then p_patch->>'error' else error end,
    error_code = case when p_patch ? 'error_code' then (p_patch->>'error_code')::int else error_code end,
    updated_at = now()
  where id = p_run and status in ('running','paused');
  return found;
end $fn$;
-- Functions in public are callable through the API by default; only the Worker's secret key (service_role) may call this.
revoke all on function public.record_run_step(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.record_run_step(uuid, jsonb, jsonb) to service_role;

-- Seed: the extraction prompt that ingest used inline before the engine, and the ingest_url definition. Source of
-- truth after this migration is these rows; web/worker/engine/seed.ts mirrors them for tests.
insert into public.prompt_versions (key, version, body, status, hash)
select k, v, b, 'active', 'sha256:' || encode(sha256(convert_to(b, 'UTF8')), 'hex')
from (values ('ingest.extract_facts', 1, $prompt$You extract facts about the brand "{{brand_name}}" from a web page. Each fact needs an exact quote copied character for character from the page text, at most {{max_quote}} characters. Sections: {{sections}}. Reply with JSON only: {"facts": [{"section": string, "claim": string, "quote": string}]}. At most 12 facts. No facts that the page does not state.$prompt$)) as s(k, v, b)
on conflict (key, version) do nothing;
insert into public.workflow_defs (id, version, spec, status) values ('ingest_url', 1, $spec${"id":"ingest_url","version":1,"title":"Read one link","concurrency":"parallel","retries":{"limit":2,"delay":"5 seconds","backoff":"exponential"},"steps":[{"id":"read","type":"fetch","label":"Reading the page","url":"$input.url","maxChars":300000,"maxBytes":600000,"excerptChars":14000},{"id":"extract","type":"llm","label":"Finding facts","prompt":"ingest.extract_facts","json":true,"vars":{"brand_name":"$input.brandName","max_quote":"$const.MAX_QUOTE","sections":"$const.SECTIONS"},"user":"Page title: {{title}}\nURL: {{url}}\n\n{{text}}","userVars":{"title":"$steps.read.title","url":"$steps.read.url","text":"$steps.read.excerpt"}},{"id":"check","type":"code","label":"Checking every quote against the page","fn":"keep_quoted_facts","args":{"facts":"$steps.extract.facts","page":"$steps.read.text"}},{"id":"save","type":"write","label":"Saving the facts","op":"save_source_facts","args":{"sourceId":"$input.sourceId","link":"$input.url","website":"$input.website","facts":"$steps.check.facts","dropped":"$steps.check.dropped","url":"$steps.read.url","title":"$steps.read.title","text":"$steps.read.text"}}],"output":"$steps.save","onFailure":{"op":"mark_source_failed","args":{"sourceId":"$input.sourceId"}}}$spec$::jsonb, 'active')
on conflict (id, version) do nothing;
