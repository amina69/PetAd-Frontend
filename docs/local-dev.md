# Local Development: Offline (MSW) vs. Staging Backend

> Branch: `docs/528-d4-local-dev-workflow`
> Issue: #528 — D4. Document local dev vs. staging backend workflow

## Overview

PetAd Frontend has **three** possible backends during development, selected entirely by environment
variables at dev-server start. This document tells you which one to use, how to switch between them,
and — importantly — which app features do **not** work in each mode.

There is **no `.env.local` committed** and **no dev-server proxy**. Your choice of backend is made
entirely by the two variables below, read fresh every time you start Vite.

---

## TL;DR — Which Mode Do I Want?

| I'm doing this… | Use | Why |
|---|---|---|
| Building a component, styling, layout, animation | **Mode A — MSW** | Zero network, instant reloads, no shared staging data to pollute |
| Writing a page that is wired to API data | **Mode A — MSW** | Handlers already exist for most reads; edit `src/mocks/handlers/` as you go |
| Writing a new endpoint's handler | **Mode A — MSW** | Add the handler next to your UI work, in the same PR |
| Testing **auth roles** (admin / shelter) | **Mode C — Staging** | The MSW login handler hardcodes `role: "USER"`; you can never see an admin queue offline |
| Testing a **multi-step write flow** (dispute → resolve → settlement) | **Mode C — Staging** | Write-then-read-back is not modelled in MSW state |
| Testing anything **not yet mocked** (see coverage table) | **Mode C — Staging** | MSW has no handler; the request falls through and fails |
| Verifying a PR before review | **Both** — A to build, C to smoke-test | See [Pre-PR checklist](#pre-pr-checklist) |

> **Rule of thumb:** build in Mode A, verify in Mode C. Never open a PR having only run Mode A if
> your change touches data flow.

---

## The Two Environment Variables

| Variable | Read at | Effect |
|---|---|---|
| `VITE_MSW` | `src/main.tsx:56`, `src/lib/api-client.ts:210` | `true` starts the MSW service worker and points the API client at the relative path `/api` |
| `VITE_API_URL` | `src/lib/api-client.ts:214`, `src/api/documentService.ts:5`, `src/hooks/useMutateRaiseDispute.ts:6` | Overrides the absolute API base URL, e.g. `https://staging.example.com/api` |

Resolution logic in `src/lib/api-client.ts` (lines 210–214):

```ts
const isMockServiceWorkerEnabled = import.meta.env.VITE_MSW === "true";
const defaultApiUrl = isMockServiceWorkerEnabled ? "/api" : "http://localhost:3000/api";
const API_URL = import.meta.env.VITE_API_URL ?? defaultApiUrl;
```

So `VITE_API_URL` always wins over `VITE_MSW`. That is convenient — but it is also the single most
common way to end up in a confusing half-state, because **`.env` in this repo sets `VITE_MSW=true`**.
See the warning below.

### ⚠️ The `VITE_MSW` trap

The committed `.env` defines the key `VITE_MSW` (it is the only key in the file), and its intended value
is `true` so that a fresh clone runs offline out of the box. **Check the value in your own checkout
before assuming it** — it is a committed file, so it can differ from the value documented here.

Vite gives shell environment variables **higher** priority than `.env` files. So this:

```bash
VITE_API_URL=https://staging.example.com/api pnpm dev   # ❌ BROKEN
```

leaves `VITE_MSW` reading `true` from `.env`. You get the **worst combination**: the service worker is
active *and* the base URL points at staging. Requests are silently answered by mocks, so the app looks
like it works while never touching the backend. You will believe your change works. It does not.

**Always set `VITE_MSW=false` explicitly when targeting a real backend.**

---

## Mode A — Offline (MSW)

**This is the default.** `.env` already sets `VITE_MSW=true`, so a plain `pnpm dev` just works.

```bash
pnpm install
pnpm dev          # http://localhost:4321
```

Optional explicit form (useful if you have a stray `VITE_MSW` in your shell or `.env.local`):

```bash
VITE_MSW=true pnpm dev
```

### What you get

- The MSW service worker registers from `/mockServiceWorker.js` and intercepts requests in the browser.
- No backend process needs to exist. Airplane mode is fine.
- Handlers live in `src/mocks/handlers/`, one module per domain. They are combined in
  `src/mocks/handlers/index.ts`.
- Handler state is **in-memory**. A full page reload resets registered users, disputes, escrow records
  and notifications back to their fixtures.

### Signing in offline

This trips up most new contributors. The mock has **no seed users** — you must create your own, in this
order:

1. Go to `/register` and create an account (any email / password; `nin` is required).
2. Go to `/login` and sign in with exactly what you just registered.
3. The session token is stored under `auth_token` in `localStorage`.

If you try to log in first you get `401 Invalid email or password` — that is correct behaviour, not a bug.

Password reset works offline and the generated token is printed to the browser console as
`[MSW] Password reset token for …`.

### Known MSW limitations

| Limitation | Detail |
|---|---|
| **Always `role: "USER"`** | `src/mocks/handlers/auth.ts` returns `role: "USER"` for every login. Role-gated screens (admin approvals, admin disputes, shelter queue) cannot be exercised offline unless you temporarily patch the handler. |
| **In-memory, resets on reload** | Good for isolation, bad for reproducing multi-step flows across a refresh. |
| **Mock WebSocket only** | The notification socket URL is built from `window.location.host` (`src/context/NotificationSocketContext.tsx`), so in MSW mode it points at the Vite dev server. No handler upgrades it; expect the bell to stay disconnected. |
| **`onUnhandledRequest: 'warn'`** | Anything MSW does not mock shows up as a console warning and a hanging/404 request. That warning *is* your signal that a handler is missing. |

---

## Mode B — Local Backend on `:3000`

For when a backend engineer is running the API on their machine and you want to test against it.

```bash
VITE_MSW=false pnpm dev
```

With `VITE_MSW=false` and no `VITE_API_URL`, `api-client.ts` falls back to
`http://localhost:3000/api`, which is also the hardcoded fallback in `documentService.ts` and
`useMutateRaiseDispute.ts`. No further configuration is needed — but the local API must send CORS
headers allowing `http://localhost:4321`.

---

## Mode C — Staging Backend (integration testing before a PR)

**This is the mode the acceptance criteria care about.** Run your branch against the shared staging
backend before opening a PR.

### Steps

1. **Find the staging host.** ⚠️ The staging URL is **not recorded anywhere in this repository** — not
   in `README.md`, not in any `docs/*.md`, not in `vercel.json`. `docs/notifications.md` references
   `api.petad.example.com` as the *production* host and does not document a staging equivalent. Get the
   current staging API base URL from the backend team's channel or the team's env var registry the first
   time, then record it below so the next contributor does not have to ask.

   ```
   STAGING_API_URL=https://<staging-host>/api
   ```

2. **Start the dev server against it — with MSW explicitly off:**

   ```bash
   VITE_MSW=false VITE_API_URL=https://<staging-host>/api pnpm dev
   ```

   ```bash
   # same thing, cross-platform-safe (Windows/PowerShell + macOS/Linux shells)
   VITE_MSW=false \
   VITE_API_URL=https://<staging-host>/api \
   pnpm dev
   ```

3. **Restart the dev server after any env change.** Vite reads env files at process start; a running
   dev server will not pick up new values, and HMR will not re-evaluate `import.meta.env`. If staging
   suddenly stops responding, restart before debugging anything else.

4. **Verify you are actually hitting staging** before you trust anything:

   - DevTools → Network → filter `fetch/xhr`. Requests must go to `https://<staging-host>/api/...`.
     If you see `http://localhost:4321/api/...`, you are not on staging.
   - DevTools → Application → Service Workers: there should be **no** active `mockServiceWorker.js`.
     `src/main.tsx` `cleanupServiceWorkers()` unregisters any stale one and reloads once automatically.
   - Console: no `[MSW]` output.

5. **Use your own staging account.** Staging is shared — do not use the seeded admin or demo accounts,
   and do not run destructive flows (dispute resolution, escrow release) against data you did not create.

### Why `VITE_API_URL` must be absolute

There is no `server.proxy` entry in `vite.config.ts`. If you set a relative value such as `/api`, the
dev server will receive `/api/...` itself and answer `404` (fetch does not send an HTML `Accept` header,
so the SPA fallback does not apply). Always use the full origin, **including the `/api` path segment**.

### CORS

The staging API must allow the origin `http://localhost:4321`. If every request fails with a CORS error
in the console, that is a backend config issue — do not work around it in the frontend.

---

## MSW Coverage — What You Can and Cannot Test Offline

Derived from the handlers registered in `src/mocks/handlers/index.ts`.

### ✅ Mocked — safe to develop against offline

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `/login`, `/request-password-reset`, `/reset-password` |
| Listings | `GET /api/listings`, `GET /api/listings/:id`, `POST /api/listings`, `PUT|DELETE /api/listings/:id`, `POST /api/listings/:id/interest`, `/favourite` |
| Adoption | `GET /api/adoption/:id`, `/timeline`, `/approvals`, `POST /api/adoption/requests`, `PATCH /api/adoption/:id/{approve,complete,status}` |
| Approvals | `GET /api/approvals`, `/admin/approvals`, `/shelter/approvals` |
| Escrow | `POST /api/escrow`, `GET /api/escrow/:id/status`, `/settlement-summary`, `PATCH /api/escrow/:id/{release,refund}`, `POST /api/escrow/:id/retry-settlement` |
| Disputes | `GET /api/disputes`, `GET /api/disputes/:id`, `POST /api/disputes`, `PATCH /api/disputes/:id/resolve` |
| Custody | `GET /api/custody/:id`, `/api/custody/:id/timeline` |
| Notifications | `GET /api/notifications`, `GET /api/notifications/:id`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/read-all`, `GET|PATCH /api/notifications/preferences` |
| Files | `GET|POST /api/adoption/:id/documents` |

### ❌ Not mocked — requires Mode C (staging) or a new handler

| Endpoint | Called from | Note |
|---|---|---|
| `POST /api/documents` | `src/api/documentService.ts:28` | Document upload |
| `PATCH /api/documents/:id/replace` | `src/api/documentService.ts:115` | Re-upload flow |
| `POST /api/documents/:id/verify` | `src/api/documentService.ts` | Admin document review |
| `POST /api/documents/:id/review` | `src/api/documentService.ts` | Admin document review |

If you are working on any of these, the fastest path is usually to **add the handler** rather than to
require staging — see [Adding a handler](#adding-a-handler).

### ⚠️ Calls that ignore `VITE_API_URL`

These modules hardcode a **relative** `/api/...` path and therefore bypass `api-client` entirely. They
work in Mode A (the service worker intercepts them) but in **Mode C they hit the Vite dev server on
`:4321` and 404**:

| Module | Calls |
|---|---|
| `src/hooks/useNotifications.ts` | `GET /api/notifications`, `PATCH /api/notifications/:id/read` |
| `src/hooks/useMutateMarkRead.ts` | `PATCH /api/notifications/:id/read` |
| `src/hooks/useMutateMarkAllRead.ts` | `POST /api/notifications/read-all` |
| `src/hooks/useNotificationDeepLink.ts` | `GET /api/notifications/:id`, `PATCH /api/notifications/:id/read` |

**If notification features appear broken in staging mode, check this first — it is a known gap, not your
change.** Routing these through `getApiClient()` would fix it; worth a follow-up issue.

One more rough edge: `src/hooks/useMutateApprovalDecision.ts` posts to `/adoption/:id/approve` with
`axios` using no base URL and no `/api` prefix, which does not match the MSW handler
(`PATCH /api/adoption/:id/approve`). Treat the approve/reject mutation as **staging-only**.

---

## Adding a Handler (preferred over needing staging)

If you are building a feature against an endpoint with no handler, add the handler in the same PR:

1. Pick the domain module in `src/mocks/handlers/` (`listings.ts`, `dispute.ts`, `files.ts`, …).
2. Add the route with `http.<method>("/api/<path>", ...)`, matching the path your service actually calls.
3. It is picked up automatically — `src/mocks/handlers/index.ts` spreads every domain array into
   `handlers`, and `src/mocks/browser.ts` passes that to `setupWorker(...)`.
4. Use the same guard pattern as `listings.ts` for authenticated mutations: return `401` unless an
   `Authorization: Bearer <token>` header is present.
5. Keep fixture state module-level so it resets on reload, consistent with the other handlers.

Remember to run `pnpm test` — `src/test/setup.ts` boots the same handler array through
`src/mocks/server.ts` (Node), so a handler you add in the browser is immediately available to Vitest.

---

## Tooling Reference

| Command | What it does | Network |
|---|---|---|
| `pnpm dev` | Vite dev server on `http://localhost:4321` (`strictPort`) | Mode A: none |
| `pnpm test` | Vitest, jsdom, MSW via `setupWorker`'s Node counterpart | none |
| `pnpm run lint` | ESLint | none |
| `pnpm run build` | `tsc -b` then `vite build` | none |
| `pnpm e2e` | Playwright — **always boots its own server with `VITE_MSW=true`** | none |

Notes that save time later:

- **Port 4321 is `strictPort`.** A stale Vite process will make `pnpm dev` fail outright rather than
  pick another port. Free 4321 before restarting.
- **`pnpm e2e` ignores your env.** `playwright.config.ts` hardcodes
  `VITE_MSW=true pnpm dev --host 127.0.0.1 --port 4321` and sets `reuseExistingServer: true`. If you
  already have a **staging-mode** dev server running on 4321, Playwright will silently reuse it and run
  the E2E suite against staging. **Stop your dev server before `pnpm e2e`**, or your local run will
  mutate shared staging data.
- **CI uses npm, not pnpm** (`.github/workflows/ci.yml`: `npm install`, `npm run lint|build|test`).
  Both lockfiles are committed. Using pnpm locally is fine; just do not "fix" CI by regenerating the
  npm lockfile.
- **HMR is bound to `localhost`** in `vite.config.ts`. Reaching the dev server via a LAN IP, container
  hostname, or forwarded port breaks hot reload even though the page loads.
- Node `>=20.19.0` is required (`package.json` `engines`); CI runs Node 20.x.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Requests hit `localhost:4321/api` in staging mode | Hardcoded relative paths (see table above) | Known gap — test that area in Mode A, or route it through `getApiClient()` |
| All data looks like fixtures but you set `VITE_API_URL` | `VITE_MSW` still `true` from `.env` | Add `VITE_MSW=false` and restart the dev server |
| `Failed to fetch` / CORS error in console | Staging API does not allow origin `localhost:4321` | Backend-side CORS config; not a frontend fix |
| `401` on every request in staging mode | Expired/invalid staging token, or token from a Mode A session left in `localStorage` | Clear `auth_token` in DevTools → Application → Local Storage, then sign in again |
| Cannot log in offline | Tried logging in without registering first | Register at `/register` first — mock users are in-memory only |
| Admin/shelter pages always redirect to `/login` offline | Mock login always returns `role: "USER"` | Use Mode C |
| `403`/`4001` from the notification socket | Socket targets `window.location.host`, not `VITE_API_URL` | Expected in every mode until the socket is pointed at `VITE_API_URL` |
| Console `[MSW] Warning: Unhandled request` | No handler for that route | Add a handler, or verify against staging |
| `Port 4321 is already in use` | Stale dev server | Kill the process holding 4321 |
| Env change appears to do nothing | Vite reads env at process start | Restart `pnpm dev` |
| Browser keeps a stale `mockServiceWorker.js` after switching modes | Service worker cached from a previous Mode A session | Hard-reload once; `cleanupServiceWorkers()` in `src/main.tsx` unregisters it and auto-reloads |

---

## Pre-PR Checklist

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes (handlers you added are exercised through `src/mocks/server.ts`)
- [ ] `pnpm run build` passes (`tsc -b` included)
- [ ] `pnpm e2e` passes **with no other dev server running on 4321**
- [ ] If the change touches data flow, auth, or an unmocked endpoint: started the server with
      `VITE_MSW=false VITE_API_URL=<staging> pnpm dev` and smoke-tested the affected screens
- [ ] If you added a mock handler: it is registered in `src/mocks/handlers/index.ts` and covered by a test
- [ ] No `auth_token` or staging credentials committed

---

## File Reference

| File | Purpose |
|---|---|
| `.env` | Sets `VITE_MSW=true` — the default offline mode |
| `src/main.tsx` | Boots the MSW service worker when `DEV && VITE_MSW === 'true'`; unregisters stale workers |
| `src/lib/api-client.ts` | Resolves `VITE_MSW` / `VITE_API_URL` into the base URL |
| `src/mocks/browser.ts` | `setupWorker(...handlers)` for the dev server |
| `src/mocks/server.ts` | Same handler array, for Vitest via `src/test/setup.ts` |
| `src/mocks/handlers/index.ts` | Aggregates all domain handler arrays |
| `src/mocks/handlers/auth.ts` | Offline register/login/reset; hardcodes `role: "USER"` |
| `src/api/documentService.ts` | Second `VITE_API_URL` read; `/api/documents*` has no mock |
| `src/hooks/useMutateRaiseDispute.ts` | Third `VITE_API_URL` read |
| `src/context/NotificationSocketContext.tsx` | WebSocket URL derived from `window.location.host` |
| `vite.config.ts` | Port 4321 (`strictPort`), `localhost`-bound HMR, no proxy, Vitest config |
| `playwright.config.ts` | Forces `VITE_MSW=true` for E2E; `reuseExistingServer: true` |
| `.github/workflows/ci.yml` | npm-based lint/build/test on Node 20.x |

---

## Assumptions

1. The staging API base URL is not committed to this repository. The placeholder
   `https://<staging-host>/api` must be replaced with the real value; record it here once confirmed so
   the "no need to ask in Slack/Discord" criterion is met.
2. Staging CORS allows `http://localhost:4321`. This is a backend responsibility.
3. `VITE_MSW` and `VITE_API_URL` are provided as shell variables on the dev-server command line so that
   `.env` cannot silently re-enable mocks.
4. ⚠️ **Neither `.env` nor `.env.local` is matched by the current `.gitignore`.** The file contains only
   the `*.locals` pattern, which does not match `.env.local`, and there is no `.env` rule at all. That
   is fine today because the committed `.env` holds only `VITE_MSW` (a boolean flag, not a secret), but
   it means **a staging token or credential placed in `.env.local` would be committable by accident.**
   Prefer the shell-variable form documented above. If you do create `.env.local`, add an explicit
   `.env*` ignore entry with a `!.env.example` exception in the same PR that introduces it.
5. MSW handler fixtures are illustrative, not authoritative copies of staging data. Do not treat a mock
   response as a contract; confirm field-level shape against staging.
6. The endpoint tables above were read from `src/mocks/handlers/*` and the service layer under
   `src/api/`. Regenerate them when handlers are added or removed.
