# Agro Field Agent

A TanStack Start (React) frontend for IntelliFeed360 — field agents, feed
operations, and admin dashboards for an agri-feed business.

## ⚠️ Backend migration in progress

This app is mid-migration from a Supabase backend to the real backend,
**IntelliFeed360** (Django REST API). See **[MIGRATION_PLAN.md](./MIGRATION_PLAN.md)**
for:

- the full endpoint mapping (which Supabase table → which API endpoint)
- known gaps where the API spec doesn't cover a feature yet
- the phase-by-phase checklist and how to resume it in a new session

**tl;dr of where things stand:** Auth (login) is fully migrated to the API.
Most data screens (farmers, health cases, nutrition plans, finance,
notifications, etc.) still read from Supabase and will keep failing until
their phase lands — check the plan file's checklist for current status.

## Setup

```bash
npm install
cp .env.example .env
# then edit .env — at minimum set VITE_API_BASE_URL
npm run dev
```

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | IntelliFeed360 API base, e.g. `https://api-testing-intellifeed360.onrender.com/api/v1` |
| `VITE_SUPABASE_URL` | Temporary | Still read by not-yet-migrated screens. Removed in migration Phase 9. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Temporary | Same as above. |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview a production build locally |
| `npm run lint` | Run ESLint |

There is no `npm start` — use `npm run dev` for local development.

## Auth

Login is phone-number + OTP (one-time code), against IntelliFeed360's
`/auth/otp/send` and `/auth/otp/verify` endpoints. JWT access/refresh tokens
are stored in `localStorage` and refreshed automatically on 401s — see
`src/lib/api/client.ts`.

Self-signup is currently disabled in the UI (`src/routes/signup.tsx`) because
the backend doesn't expose a general account-creation endpoint yet. See
MIGRATION_PLAN.md gap #6.

## Architecture notes

- `src/lib/api/client.ts` — low-level fetch wrapper: base URL config, JWT
  header injection, auto-refresh-on-401, typed `ApiError`.
- `src/lib/api/auth.ts` — auth-specific calls (OTP, `/auth/me`, logout).
- `src/lib/auth/AuthContext.tsx` — React context wrapping the above;
  exposes `session`, `hydrated`, `requestOtp`, `verifyLogin`, `logout`,
  `refresh`.
- `src/integrations/supabase/*` — legacy, being phased out. Do not add new
  Supabase calls; migrate the screen to the API client instead (see
  MIGRATION_PLAN.md for the endpoint to use).

## Contributing to the migration

Each migration phase should land as its own commit
(`feat: migrate <domain> to IntelliFeed360 API (Phase N)`) and update the
checklist in `MIGRATION_PLAN.md`. If you're picking this up in a new
session, read that file first — it has explicit "how to resume" instructions
at the bottom.
