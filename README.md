# imposter.fm

imposter.fm is a podcast site + admin CMS built with TanStack Start.

It includes:
- Public podcast pages (home, episode archive, episode detail, embeddable player)
- RSS feed at `/rss.xml`
- Audio streaming endpoint with range requests (`/api/stream/:episodeId`)
- Admin authentication + episode management (create, edit, publish, delete)
- Admin password change
- Persistent mini player that keeps playing across navigation

## Tech Stack

- TanStack Start + TanStack Router + React 19
- TanStack Query + tRPC
- Drizzle ORM + PostgreSQL
- Better Auth (email/password)
- Tailwind CSS v4
- Biome (lint/format)
- Optional PostHog analytics

## Requirements

- Bun (recommended)
- PostgreSQL database

## Environment Variables

Create `.env.local` in the project root.

Required:
- `DATABASE_URL` - Postgres connection string
- `BETTER_AUTH_SECRET` - secret for Better Auth

Optional (admin bootstrap script):
- `ADMIN_EMAIL` (default: `admin@imposter.fm`)
- `ADMIN_PASSWORD` (default: `changeme123`)
- `ADMIN_NAME` (default: `Admin`)

Optional (analytics):
- `VITE_POSTHOG_KEY` - real PostHog project key (`phc_...`)
- `VITE_POSTHOG_HOST` - defaults to `https://us.i.posthog.com`

Optional (production object storage):
- Use either `S3_*` or `R2_*` names:
- `S3_BUCKET_NAME` / `R2_BUCKET_NAME`
- `S3_ENDPOINT` / `R2_ENDPOINT`
- `S3_REGION` (defaults to `auto`)
- `S3_ACCESS_KEY_ID` / `R2_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY` / `R2_SECRET_ACCESS_KEY`

Notes:
- In development, uploads are local (`./uploads`) via `/api/upload`.
- In production, uploads use S3/R2 signed URLs.

## Local Setup

1. Install dependencies:

```bash
bun install
```

2. Create `.env.local` and add the required variables.

3. Create/update database schema:

```bash
bun run db:push
```

4. Create initial admin account:

```bash
bunx tsx scripts/create-admin.ts
```

5. Run app:

```bash
bun run dev
```

App runs on `http://localhost:3000`.

Admin login is at `/login`.

## Running Tests and Checks

```bash
bun run test
bun run lint
bun run format
bun run check
```

## Build and Run (Production)

```bash
bun run build
bun run start
```

This starts the Nitro output server from `.output/server/index.mjs`.

## Database Scripts

```bash
bun run db:generate
bun run db:migrate
bun run db:push
bun run db:pull
bun run db:studio
```

## Core Routes

Public:
- `/` - homepage with latest episode and recent episodes
- `/episodes` - archive
- `/episodes/:slug` - episode detail page
- `/embed/:slug` - embeddable player page
- `/rss.xml` - podcast RSS feed

Admin:
- `/login` - admin auth
- `/admin` - dashboard
- `/admin/episodes` - episode list
- `/admin/episodes/new` - create episode
- `/admin/episodes/:id/edit` - edit episode
- `/admin/password` - change password

API:
- `/api/stream/:episodeId` - audio streaming
- `/api/upload` (dev only) - local upload target
- `/api/trpc/*` - tRPC API

## Notes

- RSS feed works even if no `podcast` row exists (falls back to defaults).
- PostHog is skipped if `VITE_POSTHOG_KEY` is missing or placeholder (`phc_xxx`).
