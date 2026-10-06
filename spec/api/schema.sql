-- Waterlily: Supabase Postgres schema (BOILERPLATE, proposed 2026-10-06)
-- Status: proposed. It extends the data model in brand_builder_architecture.md §3.
-- Tables marked [§3] already exist in the architecture. Tables marked [NEW] close
-- gaps found in the 2026-10-06 UI review (ui gaps g1–g15).
--
-- Verified Supabase facts used here (see backend_map.md §9 for links):
--   * RLS: `alter table ... enable row level security`, then write policies with
--     `(select auth.uid())`. The select-wrapper lets Postgres cache the value per statement.
--   * The secret key (sb_secret_...) acts as service_role and BYPASSES RLS, so use it
--     only in Workers. The browser uses the publishable key (sb_publishable_...).
--   * pgvector is available (extension "vector"). It is not needed for v1. A reserved
--     column is left for later.
--   * Realtime: `alter publication supabase_realtime add table t;`

-- ---------- identity, accounts, seats ----------
create table public.profiles (               -- [NEW] g3: "Approved by", owner, seats
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz default now()
);

create table public.brands (                 -- [§3] Brand
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('company','person','founder_linked')),
  stage text,
  domain text,
  domain_verified boolean default false,     -- DNS TXT check (Onboard-2). Unverified brands are FLAGGED, not blocked
  domain_txt_token text,                     -- the unique value shown on Onboard-2
  founder_brand_id uuid references public.brands(id),  -- the Person link (§3: founder link)
  plan text default 'trial',                 -- [NEW] g3: subscription plan (billing is boilerplate, see settings)
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table public.memberships (            -- [NEW] g3: seats (owner / approver / editor / partner / ambassador)
  brand_id uuid references public.brands(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner','approver','editor','partner','ambassador')),
  voice_ids uuid[] default '{}',             -- Partners screen: which voices a seat may write in
  primary key (brand_id, user_id)
);

create table public.wallets (                -- [NEW] g3/h: a connected wallet per user (provider decided in P0)
  user_id uuid references public.profiles(id) on delete cascade,
  address text not null,                     -- base58 Solana address
  provider text not null,                    -- 'injected' | '<embedded provider TBD>'
  verified_at timestamptz,                   -- set after a signMessage challenge
  primary key (user_id, address)
);

-- ---------- brand builder (sources, evidence, kit) ----------
create table public.sources (                -- [§3] Source
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete cascade,
  kind text not null check (kind in ('site','doc','social','repo','deck','profile','interview','upload')),
  url text,
  storage_path text,                         -- Supabase Storage path for uploads
  owner_supplied boolean default false,
  status text default 'queued' check (status in ('queued','reading','read','failed','skipped')),
  error text,                                -- shown on Ingest-Error
  fetched_at timestamptz
);

create table public.evidence (               -- [§3] Evidence
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  section text not null,                     -- one of the 17 section keys
  fact text not null,
  quote text,                                -- short verbatim quote
  confidence text check (confidence in ('high','med','low')),
  status text not null check (status in ('evidenced','inferred','answered','rejected','legacy')), -- 'legacy' added: g14, §9 E(legacy)
  answered_question_key text,                -- for owner answers (interview step)
  created_at timestamptz default now()
);

create table public.kit_versions (           -- [§3] Kit version
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete cascade,
  version int not null,
  hash text,                                 -- sha256 of canonical JSON (§12.3.4, proposed)
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  unique (brand_id, version)
);

create table public.kit_sections (           -- [§3] Kit section
  kit_version_id uuid references public.kit_versions(id) on delete cascade,
  section text not null,
  content jsonb not null,
  state text not null check (state in ('E','I','M','stale')),   -- 'stale' added: g14, §12.3.2
  evidence_ids uuid[] default '{}',
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  primary key (kit_version_id, section)
);

create table public.decisions (              -- [§3] Decision (gate approvals, which mirror ADRs)
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete cascade,
  gate text check (gate in ('purpose','positioning','voice')),
  choice jsonb, rationale text,
  decided_by uuid references public.profiles(id), decided_at timestamptz default now()
);

create table public.audiences (              -- [§3] Audience
  id uuid primary key default gen_random_uuid(),
  kit_version_id uuid references public.kit_versions(id) on delete cascade,
  segment text, jobs jsonb, pains jsonb, gains jsonb, channels text[],
  validation text default 'proto' check (validation in ('proto','validated')),
  real_people jsonb,                         -- [NEW] g13: BB-5 "1–3 real people". PRIVATE: never sent to LLMs by name and never contacted
  real_people_private boolean default true
);

create table public.claims (                 -- [§3] Claim
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete cascade,
  text text not null,
  evidence_ids uuid[] not null default '{}',
  owner uuid references public.profiles(id),
  expires_at date,
  status text default 'pending' check (status in ('approved','pending','expired')),
  registration_id uuid
);

create table public.templates (              -- [§3] Template (12 presets, research 06; seeded data, versioned)
  id text primary key,                       -- 'academic', 'friendly', ...
  dims jsonb not null,                       -- {formality, energy, humour, warmth, sentence_length, jargon, emoji, cta}
  claims_strictness int not null,            -- a gate, not a slider
  content_policy_gate boolean default false, -- true for 'flirty'
  version int default 1
);

create table public.voices (                 -- [§3] Voice
  id uuid primary key default gen_random_uuid(),
  kit_version_id uuid references public.kit_versions(id) on delete cascade,
  name text, template_id text references public.templates(id),
  overrides jsonb default '{}',              -- per-channel 9-dimension overrides
  writer_rules text,                         -- compiled plain-language rules (voice compiler)
  approved boolean default false
);

-- ---------- create / publish ----------
create table public.drafts (                 -- [NEW] g1: drafts and posts
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete cascade,
  campaign_id uuid,
  author_id uuid references public.profiles(id),   -- the brand member, or the ambassador for ambassador drafts
  channel text not null,                     -- 'x' | 'linkedin' | 'blog' | 'docs' | ...
  voice_id uuid references public.voices(id),
  kit_version_id uuid references public.kit_versions(id),
  brief text,
  body text not null,
  original_body text,                        -- before the slop pass ("Show original")
  slop_fixes jsonb,                          -- [{before, after, reason}]
  scores jsonb,                              -- {voice_fit, platform, claims:{allowed, unsupported}}
  polish_history jsonb default '[]',         -- reversible polish actions (§6)
  status text default 'draft' check (status in ('draft','in_review','approved','scheduled','published','rejected','failed')),
  approved_by uuid references public.profiles(id), approved_at timestamptz,
  scheduled_for timestamptz,
  published_url text, published_at timestamptz,
  content_hash text,                         -- sha256 of the approved normalised text
  registration_id uuid,
  embedding_reserved text                    -- reserved for a pgvector "edited from original" match later
);

create table public.connections (            -- [NEW] publishing connections (Settings, Amb-4)
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles(id),
  brand_id uuid references public.brands(id),
  platform text check (platform in ('x','linkedin')),
  external_id text,                          -- X user id / LinkedIn member id
  handle text,
  access_token_enc text, refresh_token_enc text, expires_at timestamptz,  -- encrypted at rest; never sent to the browser
  scopes text[],
  status text default 'connected'
);

-- ---------- grow: campaigns, ambassadors, payouts ----------
create table public.campaigns (              -- [NEW] g2
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete cascade,
  name text, purpose text, starts_at date, ends_at date,
  platforms text[],                          -- X is allowed for brand posts but NEVER as a paid ambassador format
  success_metrics jsonb,                     -- main metric plus up to 3 supporting, each with a data source
  budget_cap_usdc numeric(12,2) default 0,   -- the cap is enforced offchain in the hackathon (no escrow)
  formats jsonb,                             -- [{format:'tutorial', payout_usdc:50}], with no X formats
  rules jsonb, status text default 'draft'
);

create table public.submissions (            -- [NEW] g2: an ambassador's piece
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  ambassador_id uuid references public.profiles(id),
  draft_id uuid references public.drafts(id),
  url text,
  verify_status text default 'pending' check (verify_status in ('pending','verifying','verified','failed','budget_reached')),
  verify_detail jsonb,                       -- which check failed (Amb-5c)
  approved_by uuid references public.profiles(id), approved_at timestamptz
);

create table public.payouts (                -- [NEW] g2
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.submissions(id),
  amount_usdc numeric(12,2) not null,
  from_address text, to_address text,
  tx_signature text,
  status text default 'pending' check (status in ('pending','sent','confirmed','failed')),
  created_at timestamptz default now()
);

-- ---------- proof layer ----------
create table public.registrations (          -- [§3] Registration, widened (g4) to match Verify-1 and §7
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id),
  type text check (type in ('identity','account','content','claim','kit','persona')),
  hash text not null,
  kit_version int,                           -- g4
  approver_id uuid references public.profiles(id),  -- g4
  author_id uuid references public.profiles(id),    -- g4
  platform_url text,                         -- g4
  campaign_id uuid,                          -- g4
  domain_verified_at_time boolean,           -- the "unverified domain" flag shown on Verify
  attestation_address text,                  -- SAS attestation PDA (primary registry)
  attestation_nonce text,                    -- the nonce address used as the PDA seed
  memo text,                                 -- fallback only: the exact memo string written onchain
  tx_signature text, cluster text default 'devnet',
  status text default 'pending' check (status in ('pending','confirmed','failed')),
  at timestamptz default now()
);
create index on public.registrations (hash);

-- ---------- AI settings ----------
create table public.ai_settings (            -- [NEW] Settings: AI model plus bring-your-own key (decision open, P4)
  brand_id uuid primary key references public.brands(id),
  provider text default 'openrouter' check (provider in ('openrouter','anthropic','openai')),
  model text,                                -- null means the platform default (an OpenRouter ':free' model chosen in P0)
  byok_key_enc text                          -- ONLY if "store encrypted server-side" is chosen; null if keys stay in the browser
);

-- ---------- experimental / coming soon (modelled so the UI has a source) ----------
create table public.personas (               -- [NEW] g6 (experimental)
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id),
  name text, voice_id uuid references public.voices(id),
  avatar_paths text[], disclosure jsonb,     -- the watermark/label flags are locked on
  registration_id uuid
);
create table public.leads (                  -- [NEW] g9 (experimental): public signals only, no harvested emails
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id),
  name text, org text, url text, signal text, score int, source text, status text
);
create table public.inbox_threads (          -- [NEW] g7 (coming soon)
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id),
  source text, external_thread_id text, contact text, labels text[],
  needs_reply boolean, flag_reason text, reply_due_at timestamptz, last_message_at timestamptz
);
create table public.metrics (                -- [NEW] g10 (roadmap analytics; X own-post metrics only in v1)
  draft_id uuid references public.drafts(id),
  captured_at timestamptz default now(),
  platform text, data jsonb,
  primary key (draft_id, captured_at)
);
create table public.jobs (                   -- [NEW] job status for progress UIs (Onboard-3b, drafting skeletons)
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id),
  kind text, status text default 'queued', progress jsonb, error text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- ---------- RLS (pattern; repeat for every brand-scoped table) ----------
alter table public.brands enable row level security;
create policy "members read brand" on public.brands for select to authenticated
  using (exists (select 1 from public.memberships m where m.brand_id = id and m.user_id = (select auth.uid())));
-- Writes go through Worker route handlers that use the secret key after their own role checks.
-- Public reads (Verify, Ledger) go through route handlers, never straight from the browser.

-- Realtime for progress screens:
alter publication supabase_realtime add table public.jobs, public.sources;
