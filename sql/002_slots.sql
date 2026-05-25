create table if not exists public.slots (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  provider text not null,
  image text not null,
  created_at timestamptz not null default timezone('utc', now())
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