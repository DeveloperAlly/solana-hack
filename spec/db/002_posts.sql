-- Waterlily S5-S6: posts drafted in the brand voice, approved, registered and verifiable.
-- Run once in the Supabase SQL editor after 001_spine.sql. Safe to re-run.
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  brief text not null,
  channel text,
  body text not null,
  checks jsonb not null default '{}',
  status text not null default 'drafted' check (status in ('drafted','approved','registered','failed')),
  kit_version int,
  hash text,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  signature text,
  attestation text,
  published_url text,
  model text,
  created_at timestamptz not null default now()
);
create index if not exists posts_brand on public.posts(brand_id);
create index if not exists posts_hash on public.posts(hash);
alter table public.posts enable row level security;
