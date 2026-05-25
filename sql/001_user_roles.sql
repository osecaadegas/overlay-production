create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'user',
  access_expires_at timestamptz,
  is_active boolean not null default true,
  moderator_permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, role)
);

create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_user_roles_role on public.user_roles(role);

alter table public.user_roles enable row level security;

drop policy if exists "users can see own roles" on public.user_roles;
create policy "users can see own roles"
on public.user_roles
for select
using (auth.uid() = user_id);