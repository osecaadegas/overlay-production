create table if not exists public.overlays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  public_id text not null unique,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists overlays_user_id_idx on public.overlays(user_id);
create index if not exists overlays_public_id_idx on public.overlays(public_id);

alter table public.overlays enable row level security;

drop policy if exists "premium users can select own overlays" on public.overlays;
create policy "premium users can select own overlays"
on public.overlays
for select
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = 'premium'
      and user_roles.is_active = true
  )
);

drop policy if exists "premium users can insert overlays" on public.overlays;
create policy "premium users can insert overlays"
on public.overlays
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = 'premium'
      and user_roles.is_active = true
  )
);

drop policy if exists "premium users can update own overlays" on public.overlays;
create policy "premium users can update own overlays"
on public.overlays
for update
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = 'premium'
      and user_roles.is_active = true
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = 'premium'
      and user_roles.is_active = true
  )
);

drop policy if exists "premium users can delete own overlays" on public.overlays;
create policy "premium users can delete own overlays"
on public.overlays
for delete
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = 'premium'
      and user_roles.is_active = true
  )
);