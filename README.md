# Smart Bookmark

Smart Bookmark is a private, realtime bookmark manager built with Next.js App Router and Supabase.
Users sign in with Google, store bookmarks securely with Row Level Security (RLS), and see updates sync instantly.

## What this project does

- Google OAuth login (Supabase Auth)
- Create and delete bookmarks (`title`, `url`)
- Keep data private per user via RLS policies
- Realtime sync of bookmark changes across sessions/tabs
- Clean responsive UI with light/dark mode and pagination

## Tech stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres, Realtime)
- Deploy target: Vercel

## Project structure

```text
app/
  auth/callback/route.ts   # exchanges OAuth code for session
  login/page.tsx           # Google sign-in entry page
  page.tsx                 # protected home page (loads bookmarks)
components/
  bookmark-manager.tsx     # client-side UI + CRUD + realtime subscription
lib/supabase/
  client.ts                # browser Supabase client
  server.ts                # server Supabase client for App Router
supabase/
  schema.sql               # table, RLS policies, realtime setup
middleware.ts              # refreshes auth session cookies
```

## Prerequisites

- Node.js 18.18+ (Node 20 LTS recommended)
- npm
- Supabase project
- Google OAuth client credentials

## Environment variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Set:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Database setup (Supabase)

1. Open your Supabase project.
2. Go to SQL Editor.
3. Run `supabase/schema.sql`.

This SQL creates:

- `public.bookmarks` table
- `user_id` default to `auth.uid()`
- RLS policies for `select`, `insert`, and `delete`
- `replica identity full` for consistent realtime delete payloads
- publication entry for `supabase_realtime`

## Auth setup (Google OAuth)

In Supabase Dashboard:

1. Go to `Authentication -> Providers -> Google`.
2. Enable Google provider.
3. Add Google Client ID and Client Secret.
4. Add callback URLs:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://<your-domain>/auth/callback`

## Run locally

Install dependencies:

```bash
npm install
```

Start dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Available scripts

- `npm run dev` - start development server
- `npm run build` - create production build
- `npm run start` - run production server
- `npm run lint` - run Next.js lint checks

## How the app works

1. `middleware.ts` refreshes Supabase auth cookies per request.
2. `app/page.tsx` checks authenticated user server-side.
3. If not authenticated, user is redirected to `/login`.
4. Login page starts Google OAuth via Supabase.
5. `app/auth/callback/route.ts` exchanges OAuth code for session.
6. Home page loads user bookmarks and renders `BookmarkManager`.
7. `BookmarkManager`:
   - inserts/deletes bookmarks
   - listens to realtime changes filtered by current `user_id`
   - refetches bookmarks after change events

## Security model

- Client-side filters are not trusted for authorization.
- RLS enforces ownership at database level:
  - read own rows only
  - insert rows only for own `user_id`
  - delete own rows only
- `user_id` defaults to `auth.uid()` to reduce tampering risk.

## Deployment to Vercel

1. Push repository to GitHub.
2. In Vercel, import the GitHub repository.
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.
5. Add deployed callback URL to Supabase Google provider:
   - `https://<your-vercel-domain>/auth/callback`

## Verification checklist

After deploy, verify:

- Login with Google works.
- You can add and delete bookmarks.
- Bookmarks are isolated per user.
- Realtime updates work in two open tabs.
- Logout redirects to login page.

## Known warnings during build

You may see a Next.js warning about multiple lockfiles and inferred workspace root.
If this repository is intentionally nested, set `outputFileTracingRoot` in `next.config.ts`.

## Troubleshooting

- OAuth redirects back but not logged in:
  - Check callback URL matches exactly in Supabase + Google settings.
- `Invalid API key` or auth errors:
  - Re-check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Realtime not updating:
  - Confirm `bookmarks` is added to publication `supabase_realtime`.
- Cannot read/write bookmarks:
  - Confirm `supabase/schema.sql` was run and RLS policies exist.

## Suggested next improvements

- Edit bookmark support
- URL normalization and duplicate detection
- Search/filter bookmarks
- Unit/integration tests (Vitest/Playwright)
- Better server-side pagination for very large datasets

