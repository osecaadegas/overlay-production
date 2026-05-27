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

The frontend will also fall back to `/api/config` at runtime if the Vite variables are missing at build time. That requires the server-side `SUPABASE_URL` and `SUPABASE_ANON_KEY` variables to be configured in Vercel.

Serverless/API:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## SQL setup

Run these files in order inside Supabase SQL Editor:

1. `sql/001_user_roles.sql`
2. `sql/002_slots.sql`
3. `sql/003_overlays.sql`
4. `sql/004_slots_seed.sql`

If your database already has an older minimal `public.slots` table, run `sql/005_slots_metadata_upgrade.sql` before `sql/004_slots_seed.sql`.

Optional: if you already have a wide slots export and need a repo-compatible seed, generate and run `sql/004_slots_seed.sql`:

```bash
node scripts/generate-clean-slots-seed.mjs /path/to/slots_rows.sql sql/004_slots_seed.sql
```

On Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\generate-clean-slots-seed.ps1 -SourcePath C:\path\to\slots_rows.sql -OutputPath .\sql\004_slots_seed.sql
```

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