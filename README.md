# Nye Center admin dashboard

Staff dashboard for the Nye Center wayfinding app (React + Vite), hosted by
AppDeck as a static website. Data and sign-in live in Supabase.

```
apps/admin       the dashboard
packages/shared  code it shares with the mobile app
```

## Run it locally

```bash
npm install
cp apps/admin/.env.example apps/admin/.env   # then fill in the two values
npm run dev
```

## Deploying

Push to `main`. GitHub Actions builds `apps/admin/dist` and publishes it. Watch
the **Actions** tab. Repository variables `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` are read at build time (publishable key only,
never a service-role key). The `AWS_*` and `S3_BUCKET` variables are filled in
by AppDeck; don't change them.

The source of the full project (mobile app, database migrations, docs) is
https://github.com/discintern/nav_app_for_the_nye_center
