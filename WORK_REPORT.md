# Work Report — Demo Mode & Audit Fixes

**Date:** 2026-11-14
**Branch:** `chore/dashboard-tooling-cleanup` (pushed to `origin`, `8517603..1922dd8`)
**`main`:** untouched
**Status:** ✅ Done. Pushed, builds pass, tested in a headless browser.

---

## 1. What you asked for

| Request | Status |
|---|---|
| Remove the audit report from the repo | ✅ `AUDIT_REPORT.md` / `.html` deleted (never committed) |
| Remove real logins; any acceptable login parameters should sign in | ✅ Any valid email + a password of 6+ characters |
| Stop fetching from the DB; use dummy data | ✅ Every screen and "create" dialog uses local mock data. No Supabase or API calls |
| Fix audit issues, smallest first | ✅ Done in 5 steps, smallest first (see section 3) |
| Push to the dashboard tooling cleanup branch | ✅ Pushed as a normal fast-forward (no force-push) |

---

## 2. How to try it

```bash
git checkout chore/dashboard-tooling-cleanup
npm ci
npm run dev
```

| Portal | URL | Lands on |
|---|---|---|
| Admin | `/login/admin` | `/admin` |
| Agent (pick **Field Agent**) | `/login/agent` | `/` |
| Agent (pick **Admin Agent**) | `/login/agent` | `/agent` |
| Feed Ops | `/login/feedops` | `/feedops` |

- **Credentials:** any email such as `test@example.com`, with any password of 6+ characters such as `secret1`.
- **Rejected:** a badly formed email ("Enter a valid email address.") or a short password ("Password must be at least 6 characters.").
- **Display name:** taken from the email: `jane.doe@x.com` → "Jane Doe".
- **Session:** kept in `localStorage`, so a reload keeps you signed in. Logout clears it.
- **Signup** (`/signup`): signs you straight in with the role you choose. Admin is not one of the choices.
- **Mock data:** whatever you add (farmers, tickets, orders, plans…) shows up right away, but **resets when the page reloads**.

---

## 3. Commits (in order)

### 1. `896b31e`: cleanup
- Deleted the untracked `AUDIT_REPORT.md`, `AUDIT_REPORT.html` and the stray `src/bun.lock`.
- README rewritten to describe demo mode and the setup steps (`cp env.example .env`).
- Page title: "IntelliFeed360 — Field Agent Dashboard" → "IntelliFeed360" on every portal.
- `package.json` name: `tanstack_start_ts` → `intellifeed360`.
- *Note:* the commit message also says it removes `django_response.txt` and untracks `supabase/.temp`. The branch had already done both, so this commit no longer contains them.

### 2. `a5021e4`: dates and greetings
- The headers show today's date instead of "May 21, 2025". The admin header shows the last 21 days.
- "Welcome, John!" and "Welcome, Dr. Jane" now use the signed-in user's first name.
- New helper: `src/lib/dates.ts`.

### 3. `893a80e`: demo-mode login
- **`src/lib/auth/AuthContext.tsx`:** new mock auth with `login(email, password, role)`, `logout()`, `session` and `hydrated`.
- **`src/components/auth/LoginCard.tsx`:**
  - Now an email + password form.
  - The agent portal has a "Sign in as" toggle.
  - A "Demo mode" note explains what credentials work.
  - The phone/OTP step, the test-code display and the "+234" prefill are gone.
- **`src/routes/signup.tsx`:** mock signup. The admin self-signup hole from audit item C6 is closed.
- **`src/routes/forgot-password.tsx`:** explains that demo mode has no real passwords.
- **Deleted** `src/lib/api/auth.ts`, the old OTP/JWT calls.

### 4. `42bbb03`: dummy data for every screen
- **`src/lib/mock/seed.ts`:** sample data generated the same way every time, with dates relative to today so "today" and "this week" views always have data.

  | Table | Rows |
  |---|---|
  | farmers | 24 |
  | products | 8 |
  | inventory | 16 |
  | orders | 30 |
  | production runs | 16 |
  | health cases | 34 |
  | nutrition plans | 16 |
  | visit reports | 36 |
  | support tickets | 10 |
  | knowledge articles | 9 |
  | notifications | 7 |
  | tasks | 6 |
  | user roles | 28 |
  | system logs | 14 |

- **`src/lib/mock/db.ts`:** an in-memory store with a small query builder that matches the part of the Supabase API the app uses.
  - It covers `select` (including linked tables like `farmers(name)`), `eq`, `in`, `gte`, `order`, `limit`, `single`, `insert`, `update` and `delete`.
  - Because of this, the existing screens and dialogs work **almost unchanged**; only their import changed.
  - It adds about 150 ms of fake latency so loading states are still visible.
- **Seeded rows follow whoever signs in**, so pages like "My visits", "My orders" and "My tickets" show data for any login.
- **`src/lib/api/{farmers,support,knowledge,tasks}.ts`:** same exports as before, but backed by the mock data. When the real backend is ready, only the function bodies need to change.
- **Deleted** `src/lib/intellifeed/api.ts`, the dead second API layer (audit H2).
- **`src/start.ts`:** removed the Supabase auth server middleware.
- **Wrong or made-up numbers fixed** in `src/lib/dashboard/queries.ts`:

  | Problem (audit #) | Fix |
  |---|---|
  | Field KPIs queried columns that don't exist (`user_id`, `visitor_id`, `visit_date`, `follow_up_needed`) (M1/M2) | Use `assigned_agent_id`, `agent_id`, `submitted_at`, `status` |
  | Today's schedule wasn't filtered by today or by the agent (M1) | Filters by agent + today |
  | "Pending tasks" counted every assignment (M3) | Counts open tasks only |
  | Farmer risk could never be "High" (M5) | Reads `severity` |
  | Alert priority guessed from `case_type` (M6) | Uses the real severity |
  | "Top nutrition issue" hardcoded as "Feed Deficiency" (M6) | Worked out from the plan data |
  | Average health score fell back to a fake **90** (H6) | Falls back to 0 |
  | Several functions ignored query errors (H6) | They now throw, so the error shows |
  | KPI cards showed **0** when loading failed (H7) | They show "—" |
  | "placed" orders displayed as "Delivered" | Shown as "Pending" |

### 5. `1922dd8`: dependencies
- **Vulnerabilities:** `npm audit fix` took them from **21 (7 critical) → 8 (0 critical)** (audit C5).
- **Two type errors** came with the newer packages:
  - `src/routes/__root.tsx`: TanStack now types the error as `unknown`.
  - `vite.config.ts`: Vite 8 moved `keepNames` from `esbuild` to `build.rolldownOptions.output`.
- **`env.example`:** dropped `VITE_SHOW_TEST_OTP`, since demo mode doesn't use it.

**Total:** 52 files changed, +1759 / −1746.

---

## 4. Merging with the existing branch

`chore/dashboard-tooling-cleanup` already had 3 commits of its own:
- leak removal + gating the test OTP code
- tooling refactor
- env docs

I applied my local commits on top of those so the push needed no force. Where the changes overlapped:

| File | Kept | Why |
|---|---|---|
| `.gitignore` | Branch version | Same change, better comment |
| `README.md` | Mine | The branch documented the OTP login, which no longer exists |
| `LoginCard.tsx` | Mine | The branch gated the OTP code display, but the OTP flow is gone completely |

---

## 5. Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ passes |
| `npm run build:dev` | ✅ passes |
| Headless-browser test, 6 login checks across 4 portals | ✅ All land on the right page; bad input shows the right error |
| Headless-browser test, 22 pages across field, agent, admin and feedops | ✅ No page errors; no "Couldn't load" or "Failed to fetch" messages |
| Reload keeps the session | ✅ |
| Network calls to Supabase or the Render API | ✅ **None.** Only Google Fonts and the avatar images (dicebear), which were already there |
| All 28 query functions run against the mock data | ✅ All return data; insert and toggle work |

---

## 6. Not done / for you to do

| Item | Why |
|---|---|
| 🔴 **Rotate the Render Postgres password** | The leaked password is still in the Git history. Only rotating it makes it harmless |
| Remaining 8 vulnerabilities (zod, minimatch) | They need breaking upgrades (`--force`), so they get their own change |
| Auto-format the whole repo (`npm run lint -- --fix`) | It reformats nearly every file, which would make the Lovable sync and any merges painful. Better done once this branch is merged |
| Reconnect the real backend (cookie login, CORS, response format, role mapping) | Audit C2–C4, M7–M11, H9–H11. Not relevant while the app runs in demo mode |
| 21 placeholder pages (most of `/admin/*` and `/feedops/*`) | Audit D7. A separate feature task |
| Tests and CI | Audit L2 |

**Local leftovers you can delete:**
- the `mock-mode` branch
- `stash@{0}`

Everything in them is already in the pushed branch.

---

## 7. Round 2: UX fixes (commits `416d6a4`, `4f46489`, `232eea8`)

| Feedback | What changed |
|---|---|
| "Sign in as" only showed Admin Agent / Field Agent | Every login page lists **all 4 roles**. The portal URL only preselects one. `/login` now exists too |
| Lovable favicon | Favicons generated from **your Agrovestors logo** (`public/1000761114.png`): `.ico` (16/32/48), a 32 px PNG and an Apple touch icon. The same mark replaces the sprout in every sidebar and the mobile top bar |
| Login / signup empty and boring | Split-screen layout with a brand panel. Card-style role picker, inline field errors, show/hide password, password strength meter (signup) and a one-click "fill demo account". Forgot-password matches |
| Calendar button did nothing | **Field / agent / feedops:** opens an activity calendar with dots on days that have events. Picking a day lists that day's events, and each one opens its screen. **Admin:** opens a 7 / 14 / 30 / 90-day range picker that drives the Platform Performance chart |
| "View Full Schedule" did nothing | Opens a **week view** on My Visits: Mon–Sun strip, previous/next/today, and the day's visits. It's backed by a new 12-week visit schedule in the mock data |
| "This Week" did nothing | Today / This week / This month selector. The numbers come from the schedule |
| Notifications didn't go anywhere | Notifications are **specific to each role**. Clicking one marks it read and opens the related screen (admin and feedops jump to the matching dashboard section). Adds "Mark all read", "View all" and an inbox page with All/Unread tabs |
| Offline Sync looked empty | Upload queue (reports, photos, profile edits, order drafts) with per-item progress during "Sync now". Also: on-device storage panel, auto-sync toggle and sync history |
| Performance looked empty | Weekly target progress, completion rate, report approval rate and farms covered. Weekly completed-vs-missed chart against the target, visit streak, team ranking, and visits by livestock and by region |

**Also fixed:**
- The field dashboard numbers now agree with the schedule.
- The agent header's "Create Nutrition Plan" button now opens the existing dialog.
- A dev-only crash on first load (duplicate React) is prevented by pre-bundling the UI packages in `vite.config.ts`.

**Verified:**
- Typecheck and build pass.
- Browser tests cover every role's login, the notification and calendar links, the period selectors, "View Full Schedule" and a sync run.
- The 22-page regression test passes, at both desktop and 390 px mobile widths.
- No console errors.

**Still not wired:** the feedops "Create Production Batch" and admin "Add New" header buttons. They have no dialogs yet.

---

## 8. Gotcha found along the way

npm **11.6.1** crashes during `npm audit fix` (`ERR_INVALID_ARG_TYPE`) and can leave `node_modules` half-installed. This workaround worked:

```bash
npm audit fix --package-lock-only
npm install
```

If `node_modules` ever looks broken, run `rm -rf node_modules && npm ci`.
