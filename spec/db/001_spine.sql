-- Waterlily spine schema (S1-S4): intake -> evidence -> kit sections -> gates -> registered kit.
-- Run once in the Supabase SQL editor. Safe to re-run (IF NOT EXISTS).
-- Only the Worker reads and writes these tables, with the secret key (which bypasses RLS, per the Supabase
-- API keys guide). RLS is on with no policies, so the publishable key in the browser cannot read or write them.

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'company' check (type in ('company','person','founder_linked')),
  description text,
  website text,
  goal text,
  channel text,
  created_at timestamptz not null default now()
);
create index if not exists brands_owner on public.brands(owner_id);

-- Intake answers per step (basics, origin, golden_circle, alternatives, audience, voice). Skip and resume.
create table if not exists public.answers (
  brand_id uuid not null references public.brands(id) on delete cascade,
  step text not null,
  data jsonb not null default '{}',
  skipped boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (brand_id, step)
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  url text not null,
  title text,
  status text not null default 'pending' check (status in ('pending','read','failed')),
  error text,
  text_excerpt text,
  fetched_at timestamptz,
  created_at timestamptz not null default now()
);

-- One fact the kit can cite: from a source (with a quote), an owner answer, or a labelled assumption.
create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  section text not null,
  claim text not null,
  quote text,
  origin text not null check (origin in ('source','owner_answer','assumption')),
  created_at timestamptz not null default now()
);
create index if not exists evidence_brand on public.evidence(brand_id);

create table if not exists public.kit_sections (
  brand_id uuid not null references public.brands(id) on delete cascade,
  section text not null,
  body text not null,
  citations uuid[] not null default '{}',
  status text not null default 'drafted' check (status in ('drafted','approved')),
  model text,
  updated_at timestamptz not null default now(),
  primary key (brand_id, section)
);

create table if not exists public.gates (
  brand_id uuid not null references public.brands(id) on delete cascade,
  gate text not null check (gate in ('purpose','positioning','voice')),
  approved_by uuid not null references auth.users(id),
  approved_at timestamptz not null default now(),
  note text,
  primary key (brand_id, gate)
);

create table if not exists public.kits (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  version int not null,
  hash text not null,
  payload jsonb not null,
  approved_by uuid not null references auth.users(id),
  signature text,
  attestation text,
  status text not null default 'pending' check (status in ('pending','registered','failed')),
  error text,
  created_at timestamptz not null default now(),
  unique (brand_id, version)
);

alter table public.brands enable row level security;
alter table public.answers enable row level security;
alter table public.sources enable row level security;
alter table public.evidence enable row level security;
alter table public.kit_sections enable row level security;
alter table public.gates enable row level security;
alter table public.kits enable row level security;
