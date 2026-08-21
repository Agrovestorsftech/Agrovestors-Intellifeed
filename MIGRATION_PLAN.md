# Migration Plan: Supabase → IntelliFeed360 API

**Goal:** Replace all direct Supabase table/auth calls with calls to the real
backend, IntelliFeed360 (Django REST API), per
`api-testing-intellifeed360.onrender.com/api/v1/`.

Supabase is being dropped as a data source entirely. It stays in the repo only
as dead weight until Phase 9 removes it.

Work is split into phases so each one lands as its own commit and the app
stays in a runnable (if partially migrated) state after every phase. If a
session runs out of budget mid-plan, check `git log` and the checklist below
to see exactly where to resume — do not restart from scratch.

---

## Endpoint map (Supabase table → IntelliFeed360 endpoint)

| Supabase table | Used in | IntelliFeed360 endpoint | Confidence |
|---|---|---|---|
| `feed_products` | `dialogs.tsx`, `feed-orders.tsx` | `GET/POST /products/feed/`, `/products/feed/{id}/` | High |
| `feed_orders` | `dialogs.tsx`, `queries.ts`, `feed-orders.tsx` | `/products/orders/`, `/products/order-items/` | Medium — need to confirm order vs order-item split |
| `inventory_items` | `queries.ts` | No direct match. Closest is deriving stock from `/products/feed/` + `/products/orders/`. | Low — **needs backend confirmation** |
| `farmers` | `dialogs.tsx`, `queries.ts`, `farmers.tsx`, `research-insights.tsx` | `POST /farmers/register` only. **No list/detail/search endpoint exists in this spec.** | Gap — see "Known gaps" below |
| `visit_reports` | `dialogs.tsx`, `queries.ts`, `performance.tsx`, `analytics.tsx` | `/farms/visits/`, `/farms/visits/{id}/` | High |
| `health_cases` | `dialogs.tsx`, `rescue-plans.tsx`, `health-assessments.tsx`, `research-insights.tsx`, `analytics.tsx` | `/intelligence/rescue-protocols/` (rescue-plans), `/intelligence/signals/` (health-assessments) | Medium — two routes may map to two different endpoints, needs confirmation per screen |
| `nutrition_plans` | `dialogs.tsx`, `queries.ts`, `nutrition-plans.tsx`, `research-insights.tsx` | `/ration/plans/`, `/ration/plans/current/`, `/ration/protocols/` | Medium |
| `notifications` | `queries.ts`, `messages.tsx` | `/notifications/`, `/notifications/{id}/mark-read/` | High |
| `user_roles` | `queries.ts`, `AuthContext.tsx` | Role comes back inline on `/auth/me` (`role` field), no separate table | High |
| `support_tickets` | `dialogs.tsx`, `support.tsx`, `agent.support.tsx` | **No equivalent endpoint in this spec at all.** | Gap |
| `tasks` | `tasks.tsx` | **No equivalent endpoint in this spec at all.** | Gap |
| `knowledge_articles` | `dialogs.tsx` (agent) | **No equivalent endpoint in this spec at all.** | Gap |

## Known gaps (need your decision before those phases start)

1. **Farmers list/search** — the spec only exposes `POST /farmers/register`.
   If farmer directory/search is core to the app, this needs a backend
   endpoint added on the Django side, or the frontend needs a different
   source for the farmer list (maybe nested under `/farms/` or
   `/farms/assignments/`, needs checking against the live server since the
   uploaded spec may be incomplete).
2. **`support_tickets`, `tasks`, `knowledge_articles`** — no backend
   equivalent exists yet. Options: (a) leave these three features on
   Supabase for now as an intentional exception, (b) hide/stub the features
   until the backend adds them, (c) confirm with backend dev if these were
   just left out of the generated spec by mistake.
3. **`inventory_items`/stock levels** — same situation, no direct endpoint;
   may need to be computed client-side from orders vs. feed products, or the
   backend needs to add one.
4. **OTP send/verify request/response bodies** — the spec's
   `drf-spectacular` output only shows `200: No response body` for these,
   which usually means the actual serializer wasn't picked up by the spec
   generator. Phase 2 builds against the standard convention
   (`{ phone }` → send, `{ phone, otp }` → verify, response
   `{ access, refresh, user }`). **This will need a one-line field-name fix
   once tested against the live server** — flagged clearly in code comments.

5. **Role model mismatch (found during Phase 2).** The API's `Role430Enum`
   (`farmer`, `agent`, `nutritionist`, `admin`, `investor`) doesn't line up
   with this app's existing `UserRole`/portal model
   (`system_admin`, `field_agent`, `admin_agent`, `feedops`). Current
   best-guess mapping lives in `src/lib/auth/types.ts`
   (`mapApiRoleToUserRole`):
   - `admin` → `system_admin`, `agent` → `field_agent`,
     `nutritionist` → `admin_agent` (reasonable matches)
   - `farmer` and `investor` → fall back to `field_agent` so the app
     doesn't crash, but they'll land on the wrong dashboard. **No portal
     exists for these yet.**
   - This app's `feedops` role has **no equivalent at all** in the API's
     role enum — the Feed Operations portal is unreachable for any real
     API user until this is resolved.
   Needs a product decision on whether to add farmer/investor/feedops
   portals or fold those users into existing ones.
6. **Self-signup is not possible right now (found during Phase 2).**
   `POST /farmers/register` is the only self-service account-creation
   endpoint in the spec, and — like OTP send/verify — its request/response
   body isn't documented (same drf-spectacular gap). There's no endpoint at
   all for creating agent/nutritionist/admin accounts. `signup.tsx` has
   been replaced with an honest "not available yet" placeholder rather than
   a form built on guessed field names. Revisit once the backend exposes
   (or confirms) these shapes.

None of these block Phases 0–3. Flag decisions on gaps 1–3, 5, 6 whenever you
reach the phase that needs them.

---

## Phases

- [x] **Phase 0 — Baseline commit.** Git init, commit current (broken) state
      as a reference point. *(done)*
- [x] **Phase 1 — API client core.** `src/lib/api/client.ts`: fetch wrapper,
      base URL config, JWT access/refresh token storage, auto-refresh-on-401,
      typed error handling. *(done)*
- [x] **Phase 2 — Auth.** `src/lib/api/auth.ts` (OTP send/verify, `/auth/me`,
      logout) + full rewrite of `AuthContext.tsx` to use JWT instead of
      `supabase.auth.*`. `LoginCard.tsx` rewritten as two-step phone → OTP
      flow. `signup.tsx` replaced with a placeholder (see gap #6 above —
      no working signup endpoint to build against). Role-mapping gap (#5)
      found and documented, `mapApiRoleToUserRole` added as a stopgap.
      `npx tsc --noEmit` confirmed no new type errors introduced. *(done)*
- [ ] **Phase 3 — Products domain.** `feed_products`, `feed_orders` →
      `/products/feed/`, `/products/orders/`, `/products/order-items/`.
      Fixes the original 400 error in `dialogs.tsx` / `feed-orders.tsx`.
- [ ] **Phase 4 — Farms & visits.** `visit_reports` → `/farms/visits/`.
      Surface the farmers-list gap here since `performance.tsx` and
      `analytics.tsx` need farmer names alongside visits.
- [ ] **Phase 5 — Batches.** Any batch-related dashboard widgets →
      `/batches/`, `/batches/active/`, `/batches/trajectories/`.
- [ ] **Phase 6 — Health & intelligence.** `health_cases` across
      `rescue-plans.tsx`, `health-assessments.tsx`, `research-insights.tsx`,
      `analytics.tsx` → `/intelligence/rescue-protocols/` and
      `/intelligence/signals/`.
- [ ] **Phase 7 — Ration/nutrition.** `nutrition_plans` →
      `/ration/plans/`, `/ration/plans/current/`, `/ration/protocols/`.
- [ ] **Phase 8 — Finance & notifications.** `/finance/*` (new feature
      surface, not currently wired to Supabase — check if any UI needs it),
      `notifications` → `/notifications/`.
- [ ] **Phase 9 — Gap resolution + Supabase removal.** Resolve the three
      no-backend-equivalent features per your decision, delete
      `src/integrations/supabase/*`, remove `@supabase/supabase-js` from
      `package.json`, delete `supabase/migrations/`, final `README.md` pass.

---

## How to resume this in a new session

1. `git log --oneline` to see which phases are committed.
2. Open this file, find the first unchecked phase.
3. Tell Claude: *"Continue MIGRATION_PLAN.md at Phase N."*
4. Each phase should end with a commit message like
   `feat: migrate <domain> to IntelliFeed360 API (Phase N)`.
