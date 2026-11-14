# IntelliFeed360

A TanStack Start (React) frontend for IntelliFeed360 — field agent, admin
agent (nutrition/vet), feed operations, and system admin dashboards for an
agri-feed business.

## ⚠️ Demo mode

The app currently runs **entirely on local dummy data**. There are no calls
to Supabase or the IntelliFeed360 API:

- **Login:** any well-formed email + any password of 6+ characters. The role
  comes from the portal you sign in on (`/login/admin`, `/login/agent`,
  `/login/feedops`; the agent portal lets you pick Field Agent or Admin Agent).
- **Data:** every screen reads from an in-memory store seeded in
  `src/lib/mock/`. Creating records works but resets on page reload.

Reconnecting the real backend is tracked in [MIGRATION_PLAN.md](./MIGRATION_PLAN.md).

## Setup

```bash
npm install
cp env.example .env   # optional in demo mode
npm run dev
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview a production build locally |
| `npm run lint` | Run ESLint |

## Architecture notes

- `src/lib/auth/AuthContext.tsx` — mock auth; exposes `session`, `hydrated`,
  `login`, `logout`. Session persists in `localStorage`.
- `src/lib/mock/` — seed data and in-memory store used by all queries.
- `src/lib/dashboard/queries.ts` + `src/hooks/useDashboard.ts` — data access
  used by the screens.
- `src/lib/api/client.ts` — fetch wrapper kept for when the real API is
  reconnected (currently unused).
- `src/integrations/supabase/*` — legacy, unused. Row types from
  `types.ts` are still used to shape the mock data.
