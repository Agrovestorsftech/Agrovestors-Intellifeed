# IntelliFeed360

A TanStack Start (React) frontend for IntelliFeed360 — field agent, admin
agent (nutrition/vet), feed operations, and system admin dashboards for an
agri-feed business.

## Modes

`VITE_AUTH_MODE` picks where the data comes from:

- **`api`** (set it in `.env.local`): the IntelliFeed360 Django API. You sign in
  with a real staff account, and a new browser is confirmed with an emailed
  code (test accounts get the code filled in). All four dashboards read and
  write the backend. In development, Vite proxies `/api` to
  `VITE_API_PROXY_TARGET` (default: the testing API).
- **`demo`** (the default): local dummy data, no backend.
  - **Login:** any well-formed email + any password of 6+ characters. The
    role comes from the portal you sign in on (`/login/admin`, `/login/agent`,
    `/login/feedops`; the agent portal lets you pick Field Agent or Admin
    Agent).
  - **Data:** every screen reads from an in-memory store seeded in
    `src/lib/mock/`. Creating records works but resets on page reload.

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
