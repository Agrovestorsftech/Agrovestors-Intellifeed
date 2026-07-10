# IntelliFeed360 — Backend Wiring & RBAC Plan

Goal: replace the frontend-only mock auth and placeholder data with a real Lovable Cloud (Supabase) backend, enforce role-based access on the server, and make every CTA (buttons, "See more", notifications) actually do something. No code lands in this step — this plan defines scope, schema, security, and UI wiring before implementation.

---

## 1. Backend enablement

- Enable **Lovable Cloud** (Supabase under the hood). All secrets (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) live in the platform, never in the repo. `.env` stays out of git; only `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` are exposed to the browser.
- Client split:
  - Browser: `@/integrations/supabase/client` (publishable key, RLS applies).
  - Server-fn user context: `requireSupabaseAuth` middleware.
  - Admin/service-role: `client.server.ts`, imported only inside `.handler()` bodies.

## 2. Auth model

- Supabase Auth with **email + password** (matches current 4 demo logins). Optional Google later.
- Keep the three portal login pages (`/login/admin`, `/login/agent`, `/login/feedops`) as UI shells; they call `supabase.auth.signInWithPassword`. Post-login redirect uses the user's role (see §3) instead of the portal they logged in from.
- Sessions: Supabase-managed (localStorage + refresh). Retire the custom `intellifeed360.session.v1` store and the mock `AuthContext`; rewrite `AuthContext` to wrap `supabase.auth` (session, `onAuthStateChange`, `signOut`).
- Route guards move to the TanStack `_authenticated` pattern:
  - `src/routes/_authenticated/route.tsx` — signed-in gate (`ssr: false`, redirect to `/login/agent` by default).
  - Nested pathless layouts for RBAC: `_authenticated/_admin`, `_authenticated/_agent-portal`, `_authenticated/_field`, `_authenticated/_feedops`, each checking `has_role` via router context.
  - Existing `/admin`, `/agent`, `/feedops`, and Field Agent routes move under the appropriate layout.
- Server-side, every `createServerFn` uses `.middleware([requireSupabaseAuth])` and re-checks role with the `has_role` RPC before privileged work. Never trust the client-declared role.

## 3. Roles & RBAC

Roles enum (`app_role`): `system_admin`, `field_agent`, `admin_agent`, `feedops`.

- Separate `public.user_roles(user_id, role)` table — never store role on `profiles`.
- `public.has_role(_user_id uuid, _role app_role)` SECURITY DEFINER function used in every RLS policy and in server functions.
- Route → role map identical to the current `route-policy.ts`.
- `ROLE_HOME` used after login to send the user to their portal regardless of which login page they used.

## 4. Database schema (all in `public`, RLS ON, explicit GRANTs)

Core:
- `profiles` (id = auth.users.id, full_name, phone, avatar_url, initials, portal_prefs jsonb, created_at). Auto-created via `on_auth_user_created` trigger.
- `user_roles` (as above).

Domain — Field Agent:
- `farmers` (id, name, farm_name, region, phone, assigned_agent_id, livestock_type, status).
- `farm_visits` (id, farmer_id, agent_id, scheduled_at, status, notes, photos jsonb, synced bool).
- `visit_reports` (id, visit_id, farmer_id, agent_id, species, priority, status['pending','under_review','approved'], submitted_at, payload jsonb).
- `feed_orders` (id, farmer_id, agent_id, product, quantity, status, placed_at).
- `tasks` (id, assignee_id, title, due_at, status, priority).

Domain — Admin Agent (Nutrition/Vet):
- `nutrition_plans` (id, farmer_id, created_by, species, plan jsonb, effective_from, status).
- `health_cases` (id, farmer_id, opened_by, severity, status, diagnosis, treatment).
- `rescue_plans` (id, case_id, steps jsonb, status).
- `consultations` (id, farmer_id, agent_id, scheduled_at, mode, notes).
- `knowledge_articles` (id, title, category, body, tags text[], published bool).

Domain — FeedOps:
- `feed_products` (id, sku, name, category, unit).
- `inventory_items` (id, product_id, warehouse, quantity, reorder_level).
- `production_runs` (id, product_id, batch_no, quantity, status, started_at, finished_at).
- `stock_transfers`, `suppliers`, `quality_checks`, `deliveries` (linked to `feed_orders`).

Domain — Admin/System:
- `system_logs` (id, actor_id, action, entity, entity_id, meta jsonb, created_at).
- `support_tickets` (id, opened_by, assignee_id, subject, status, priority, portal).
- `ticket_messages` (id, ticket_id, author_id, body, created_at).
- `notifications` (id, recipient_id, type, title, body, link, read_at, created_at).
- `audit_trail` view over `system_logs` for admins.
- `platform_metrics` (materialised or view) feeding admin KPI cards.

Cross-cutting:
- `activities` (id, actor_id, verb, target_type, target_id, meta jsonb, created_at) — powers Recent Activity feeds.

Every `CREATE TABLE` is followed in the same migration by:
```
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<t> TO authenticated;
GRANT ALL ON public.<t> TO service_role;
```
`anon` gets `SELECT` only on genuinely public tables (`knowledge_articles WHERE published`).

## 5. RLS policies (summary)

- `profiles`: owner read/update; admins read all via `has_role(..., 'system_admin')`.
- `user_roles`: user reads own rows; only system_admin writes.
- `farmers`, `farm_visits`, `visit_reports`, `feed_orders`, `tasks`: field agents access rows where `assigned_agent_id = auth.uid()` (or agent_id); admin agents read all reports/farmers assigned to them; system_admin full read.
- `nutrition_plans`, `health_cases`, `rescue_plans`, `consultations`: admin_agent full CRUD; field_agent read-only for their farmers; system_admin read.
- FeedOps tables: `feedops` role CRUD; system_admin read; others no access.
- `system_logs`, `audit_trail`, `platform_metrics`, `support_tickets` cross-portal views: system_admin only; ticket opener sees own tickets.
- `notifications`: recipient-only read/update (mark as read).
- `knowledge_articles`: public SELECT where `published = true`; admin_agent + system_admin write.
- No policy references its own table via subquery — always go through `has_role` (avoids infinite recursion).

## 6. Server functions (createServerFn)

Grouped by portal, all under `src/lib/<domain>.functions.ts`, all with `requireSupabaseAuth` + explicit role check:

- `auth.functions.ts`: `getMe`, `signOut`, `updateProfile`.
- `field.functions.ts`: `listMyFarmers`, `listTodaysVisits`, `startVisit`, `submitReport`, `syncOfflineBatch`, `listMyTasks`.
- `agent.functions.ts`: `listReportsAwaitingReview`, `reviewReport`, `createNutritionPlan`, `updateHealthCase`, `listCriticalAlerts`, `listFarmerHealth`, `listKnowledge`.
- `feedops.functions.ts`: `listInventory`, `createProductionRun`, `updateOrderStatus`, `listRecentOrders`, `listQualityChecks`.
- `admin.functions.ts`: `listUsers`, `createUser`, `assignRole` (service-role, `await import(...)` inside handler), `listSystemLogs`, `listSupportTickets`, `platformKpis`, `userDistribution`.
- `notifications.functions.ts`: `listNotifications`, `markRead`, `markAllRead`.
- `activities.functions.ts`: `recentActivities(portalScope)`.

All list functions accept pagination `{ limit, cursor }` so "See more" can page.

## 7. Seed data (replaces placeholders)

Delivered via a single seed migration so demos have realistic content:

- 1 system_admin, 2 field_agents, 2 admin_agents, 2 feedops users (created via `auth.admin.createUser` in migration + role rows).
- 25 farmers spread across regions, assigned to the field agents.
- 40 visit_reports (mix of pending/under_review/approved, priorities High/Medium/Normal).
- 15 nutrition_plans, 8 health_cases (2 critical), 5 rescue_plans.
- 12 feed_products, inventory rows per warehouse, 20 feed_orders (varied statuses), 10 production_runs, 6 deliveries, 8 quality_checks.
- 30 activities, 20 notifications per demo user, 10 support_tickets, 200 system_logs across 30 days for the platform-performance chart.
- 12 knowledge_articles.

Demo credentials are preserved (`admin@intellifeed360.com`, `AGT001@…`, `ADM001@…`, `FOP001@…`, all `Password123`) so the current login hints keep working.

## 8. UI wiring — every CTA becomes real

Every current component gets a data source and each button an action. Concretely:

- **KPI cards** (all portals): fed by `platformKpis`, `field.myKpis`, `agent.myKpis`, `feedops.kpis`. Numbers auto-refresh via TanStack Query.
- **Tables** (ReportsAwaitingReview, RecentOrders, InventorySummary, FarmerHealthMonitoring, SystemLogs, SupportTickets, UserDistribution rows):
  - Rows are clickable → detail route (`/agent/reports-review/$id`, `/feedops/orders/$id`, etc.).
  - "Review All Reports" / "See more" / "View all" buttons → the corresponding list route with server-paginated tables.
  - Row-level status/priority badges reflect DB values.
- **Quick Actions** grids (Field, Admin Agent Vet Workspace, FeedOps, Admin quick management):
  - Each tile opens a dialog or navigates to its route (Start Visit, Add Farmer, Create Nutrition Plan, New Production Run, Invite User, etc.). All mutations go through server functions.
- **Notifications bell** in every header:
  - Popover lists latest 10 via `listNotifications`, badge count from unread.
  - "Mark all as read" and per-item click → mark read + navigate to `notification.link`.
  - "See all notifications" → `/notifications` route (per-portal filtered).
- **Header search** (all portals): global search server fn scoped by role (farmers/reports for agents, orders/inventory for feedops, users/logs for admin).
- **Sidebar user + logout**: already using confirm dialog; switch handler to `supabase.auth.signOut()` + `router.invalidate()` + navigate to correct login.
- **Charts** (PlatformPerformance, NutritionMonitoring, ProductionOverview): fed by aggregate server fns over `system_logs`, `visit_reports`, `production_runs`.
- **Forms** (Add Farmer, Submit Report, Create Nutrition Plan, New Order, Invite User): react-hook-form + Zod, submit → server fn → toast + query invalidation.
- **Empty / loading / error states**: every route uses TanStack Query loader + `errorComponent` + `notFoundComponent`.

## 9. Security posture

- No secrets in the repo. `.env` gitignored; only `VITE_*` public keys committed if needed for local dev.
- RLS ON for every table; deny-by-default; policies routed through `has_role`.
- Service role key used only inside `.handler()` bodies via dynamic import — never in components, never in loaders.
- `assignRole`, `createUser`, and other privileged fns verify `has_role(caller, 'system_admin')` before acting.
- Rate-limit sensitive fns (login attempts, invites) using Supabase's built-in throttling + a `login_attempts` table.
- HIBP leaked-password check enabled on Supabase Auth.
- Public API routes (`/api/public/*`) — none needed initially; if added later (webhooks), HMAC-verified.
- Audit: every mutation server fn writes a `system_logs` row (actor, action, entity).
- Client never receives PII of other users; `listUsers` returns minimal fields for non-admins.

## 10. Delivery order (when we start coding)

1. Enable Cloud → migration: enum, `user_roles`, `has_role`, `profiles` + trigger, GRANTs, RLS.
2. Migration: all domain tables + GRANTs + RLS policies.
3. Seed migration (users, roles, demo data).
4. Rewrite `AuthContext` on top of `supabase.auth`; delete `mock-users.ts`, `session.ts`. Update login pages to use email+password.
5. Introduce `_authenticated` + role sub-layouts; move existing routes under them; update `route-policy` usage or remove.
6. Ship server functions per portal (Field → Admin Agent → FeedOps → Admin).
7. Replace placeholder data in each dashboard component with `useSuspenseQuery` bound to those server fns.
8. Wire every button/CTA (quick actions, tables, "See more", notifications, header search, forms).
9. SEO/head metadata pass per route (unique title/description, og:image where meaningful).
10. Security review: run scanner, verify RLS with each demo user, confirm no service-role leaks in client bundle.

## 11. Out of scope for this phase

- Realtime subscriptions (can add later on notifications/inventory).
- Payments, email/SMS providers (would be follow-ups behind connectors).
- Mobile-native offline sync engine (kept as UI stub for now).

---

Approve this and I'll start with step 1 (enable Cloud + first schema migration).