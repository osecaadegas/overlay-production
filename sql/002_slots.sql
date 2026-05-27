create table if not exists public.slots (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  provider text not null,
  image text not null,
  created_at timestamptz not null default timezone('utc', now()),
  rtp numeric,
  volatility text,
  reels integer,
  max_win_multiplier numeric,
  min_bet numeric,
  max_bet numeric,
  features jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}'::text[],
  status text not null default 'live',
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default timezone('utc', now()),
  created_by text,
  updated_by text,
  description text,
  release_date text,
  paylines integer,
  theme text,
  confidence_score numeric,
  image_safety_status text,
  moderation_status text,
  release_year integer,
  source_citations text[] not null default '{}'::text[],
  ai_extracted_at timestamptz,
  verified_at timestamptz,
  compliance_ok boolean,
  ingestion_version text,
  deleted_at timestamptz,
  twitch_safe boolean
);

create index if not exists idx_slots_provider on public.slots(provider);
create index if not exists idx_slots_name on public.slots(name);

alter table public.slots enable row level security;

drop policy if exists "Allow read access to authenticated users" on public.slots;
create policy "Allow read access to authenticated users"
  on public.slots
  for select
  to authenticated
  using (true);

drop policy if exists "Allow all operations for authenticated users" on public.slots;
create policy "Allow all operations for authenticated users"
  on public.slots
  for all
  to authenticated
  using (true)
  with check (true);