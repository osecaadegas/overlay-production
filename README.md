# Overlay Center

This is a standalone extraction of the overlay control center into its own project.

## What is included

- React/Vite app for login and overlay management
- Extracted `OverlayControls` module and widget configuration UI
- Public overlay preview route for OBS/browser source usage
- Serverless API routes for `get`, `create`, `update`, and `public` overlay access
- SQL files for the minimum required schema

## Project URLs

- Overlay center: `/overlay-center`
- Legacy alias: `/premium/overlay-controls`
- Public overlay: `/premium/overlay?id=<public_id>`
- Additional alias: `/overlay?id=<public_id>`

## Environment variables

Copy `.env.example` to `.env` and fill in the values.

Client:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Serverless/API:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## SQL setup

Run these files in order inside Supabase SQL Editor:

1. `sql/001_user_roles.sql`
2. `sql/002_slots.sql`
3. `sql/003_overlays.sql`

After that, give the target user the premium role:

```sql
insert into public.user_roles (user_id, role, is_active)
values ('YOUR_AUTH_USER_UUID', 'premium', true)
on conflict (user_id, role)
do update set is_active = true, updated_at = now();
```

## Separate domain checklist

- Add the new domain to Supabase Auth URL configuration.
- Add the new domain to Google/Twitch OAuth redirect allow-lists.
- Set the Site URL in Supabase to the new project domain.
- Keep `redirectTo` dynamic; this project already uses `window.location.origin`.

## Notes

- The public overlay preview polls for updates every few seconds so the settings preview reflects changes without Realtime.
- The extracted center depends on Supabase Auth, `user_roles`, `slots`, and `overlays`.