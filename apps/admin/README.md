# Admin dashboard

React + Vite dashboard where approved staff edit the app's content: spaces, tools,
events, FAQs, every map pin, the Home screen and the contact details. It also runs
manual 25Live imports, reports source changes, and keeps archived events separate
from active records and draft alerts.

Architecture and conventions live in [`/docs`](../../docs/README.md). Editors who
don't write code want [docs/05 · The admin dashboard](../../docs/05-admin-dashboard.md).

## Run & build

```bash
# from the repository root (canonical)
npm run admin           # dev server
npm run admin:build     # production build → apps/admin/dist
```

## Environment

Create `apps/admin/.env` (git-ignored):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable / anon key>
```

Only `VITE_`-prefixed variables are exposed by Vite. Use the publishable key —
**never** a service-role key, which bypasses every security rule.

## How a page is built

Every editor page is the same `ContentPage` component driven by a config object in
`src/services/contentService.js`. Adding a field to a form means editing that
config, not writing UI. Config keys normally match table names;
`events_archived` is the intentional exception that gives archived rows their own
route while reading the `events` table.

## Access

Sign-in is Supabase Auth; the app then checks the user against `admin_profiles` to
decide what to show. That check is only for the interface — **the real protection is
Row-Level Security in Postgres**, so a modified front-end still cannot write. See
[docs/04 § Security](../../docs/04-database.md#security--how-the-rules-actually-work),
and [docs/07 § Adding an admin](../../docs/07-changing-safely.md#adding-an-admin).

## Deploy

`npm run admin:build` produces a static `dist/` — host it anywhere, with
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` configured there.
