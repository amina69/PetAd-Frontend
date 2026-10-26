# Phase 3 Responsive QA — 375 / 768 / 1280 audit

**Issue:** [#553 — Confirm responsive behavior across breakpoints for all Phase 3 screens](https://github.com/amina69/PetAd-Frontend/issues/553)
**Base commit:** `812bc3f` (upstream `main`)
**Captured:** 2026-10-05 with Chromium 147 (Playwright), full-page screenshots at **375×812**, **768×1024**, **1280×900**
**Figma:** [PETAD file, node 373-4974](https://www.figma.com/design/avLyxNlVzfPjCft7sVrlzs/PETAD?node-id=373-4974) (tied to the Phase 3 sign-off session in #555)

Screens were captured against the dev server with MSW mocking enabled (`VITE_MSW=true`), authenticated by seeding a dummy `auth_token` (see `src/hooks/useAuth.ts`), using the reusable script [`scripts/capture-responsive-screenshots.mjs`](../../scripts/capture-responsive-screenshots.mjs).

## Scope — Phase 3 screens

Per #538, Phase 3 covers the **adoption, custody, approval, and dispute** flows, plus the notification screens of Epic C (#552):

| # | Screen | Route | Page |
|---|--------|-------|------|
| 1 | Adoption timeline | `/adoption/:id/timeline` | `AdoptionTimelinePage` |
| 2 | Custody timeline | `/custody/:id/timeline` | `CustodyTimelinePage` |
| 3 | Settlement summary | `/adoption/:id/settlement` | `SettlementSummaryPage` |
| 4 | Admin approval queue | `/admin/approvals` | `AdminApprovalQueuePage` |
| 5 | Shelter approval queue | `/shelter/approvals` | `ShelterApprovalQueuePage` |
| 6 | My disputes | `/disputes` | `MyDisputesPage` |
| 7 | Dispute detail | `/disputes/:id` | `DisputeDetailPage` |
| 8 | Admin disputes | `/admin/disputes` | `AdminDisputeListPage` |
| 9 | Notifications | `/notifications` | `notificationPage` |
| 10 | Notification preferences | `/notification-preferences` | `NotificationPreferencesPage` |
| 11 | Notification settings | `/settings/notifications` | `settings/NotificationsPage` |

## Results matrix

Horizontal overflow = `document.scrollWidth − clientWidth` (px). Any value > 0 means the page scrolls sideways — a responsive defect.

| Screen | 375px | 768px | 1280px | Notes |
|--------|:-----:|:-----:|:------:|-------|
| Adoption timeline | ⚠️ **71** | ⚠️ **36** | ✅ 0 | Renders "Adoption Timeline", no console errors |
| Custody timeline | ⚠️ **71** | ⚠️ **36** | ✅ 0 | Renders, no console errors |
| Settlement summary | ⚠️ **71** | ⚠️ **36** | ✅ 0 | Also finding **R4** (3-col grid at 375) |
| Admin approval queue | ⚠️ **71** | ⚠️ **36** | ✅ 0 | Renders "Approval Queue", no console errors |
| Shelter approval queue | ⚠️ **71** | ⚠️ **36** | ✅ 0 | Renders, no console errors |
| My disputes | ⚠️ **71** | ⚠️ **36** | ✅ 0 | Renders, no console errors |
| Dispute detail | ⚠️ **71** | ⚠️ **36** | ✅ 0 | Renders, no console errors |
| Admin disputes | ⚠️ **71** | ⚠️ **36** | ✅ 0 | Renders, no console errors |
| Notifications | ❌ **blank** | ❌ **blank** | ❌ **blank** | Crashes — finding **R2** |
| Notification preferences | ⚠️ **71** | ⚠️ **36** | ✅ 0 | Mock API 404 — finding **R3** |
| Notification settings | ⚠️ **71** | ⚠️ **36** | ✅ 0 | Mock API 404 — finding **R3** |

## Screenshots

Images live in [`docs/qa/responsive-phase3/`](responsive-phase3/) (`<screen>-<width>.png`, full-page).

| Screen | 375px | 768px | 1280px |
|--------|-------|-------|--------|
| Adoption timeline | [![375](responsive-phase3/adoption-timeline-375.png)](responsive-phase3/adoption-timeline-375.png) | [![768](responsive-phase3/adoption-timeline-768.png)](responsive-phase3/adoption-timeline-768.png) | [![1280](responsive-phase3/adoption-timeline-1280.png)](responsive-phase3/adoption-timeline-1280.png) |
| Custody timeline | [![375](responsive-phase3/custody-timeline-375.png)](responsive-phase3/custody-timeline-375.png) | [![768](responsive-phase3/custody-timeline-768.png)](responsive-phase3/custody-timeline-768.png) | [![1280](responsive-phase3/custody-timeline-1280.png)](responsive-phase3/custody-timeline-1280.png) |
| Settlement summary | [![375](responsive-phase3/settlement-summary-375.png)](responsive-phase3/settlement-summary-375.png) | [![768](responsive-phase3/settlement-summary-768.png)](responsive-phase3/settlement-summary-768.png) | [![1280](responsive-phase3/settlement-summary-1280.png)](responsive-phase3/settlement-summary-1280.png) |
| Admin approval queue | [![375](responsive-phase3/admin-approvals-375.png)](responsive-phase3/admin-approvals-375.png) | [![768](responsive-phase3/admin-approvals-768.png)](responsive-phase3/admin-approvals-768.png) | [![1280](responsive-phase3/admin-approvals-1280.png)](responsive-phase3/admin-approvals-1280.png) |
| Shelter approval queue | [![375](responsive-phase3/shelter-approvals-375.png)](responsive-phase3/shelter-approvals-375.png) | [![768](responsive-phase3/shelter-approvals-768.png)](responsive-phase3/shelter-approvals-768.png) | [![1280](responsive-phase3/shelter-approvals-1280.png)](responsive-phase3/shelter-approvals-1280.png) |
| My disputes | [![375](responsive-phase3/my-disputes-375.png)](responsive-phase3/my-disputes-375.png) | [![768](responsive-phase3/my-disputes-768.png)](responsive-phase3/my-disputes-768.png) | [![1280](responsive-phase3/my-disputes-1280.png)](responsive-phase3/my-disputes-1280.png) |
| Dispute detail | [![375](responsive-phase3/dispute-detail-375.png)](responsive-phase3/dispute-detail-375.png) | [![768](responsive-phase3/dispute-detail-768.png)](responsive-phase3/dispute-detail-768.png) | [![1280](responsive-phase3/dispute-detail-1280.png)](responsive-phase3/dispute-detail-1280.png) |
| Admin disputes | [![375](responsive-phase3/admin-disputes-375.png)](responsive-phase3/admin-disputes-375.png) | [![768](responsive-phase3/admin-disputes-768.png)](responsive-phase3/admin-disputes-768.png) | [![1280](responsive-phase3/admin-disputes-1280.png)](responsive-phase3/admin-disputes-1280.png) |
| Notifications (blank — R2) | [![375](responsive-phase3/notifications-375.png)](responsive-phase3/notifications-375.png) | [![768](responsive-phase3/notifications-768.png)](responsive-phase3/notifications-768.png) | [![1280](responsive-phase3/notifications-1280.png)](responsive-phase3/notifications-1280.png) |
| Notification preferences | [![375](responsive-phase3/notification-preferences-375.png)](responsive-phase3/notification-preferences-375.png) | [![768](responsive-phase3/notification-preferences-768.png)](responsive-phase3/notification-preferences-768.png) | [![1280](responsive-phase3/notification-preferences-1280.png)](responsive-phase3/notification-preferences-1280.png) |
| Notification settings | [![375](responsive-phase3/notification-settings-375.png)](responsive-phase3/notification-settings-375.png) | [![768](responsive-phase3/notification-settings-768.png)](responsive-phase3/notification-settings-768.png) | [![1280](responsive-phase3/notification-settings-1280.png)](responsive-phase3/notification-settings-1280.png) |

## Findings

### R1 — Global navbar overflows the viewport on mobile and tablet (all screens)

- **Measured:** every layout screen scrolls horizontally by **71px at 375px** and **36px at 768px** (0 at 1280px).
- **Cause:** `src/components/layout/Navbar.tsx:43` —
  `<nav className="sticky top-0 z-50 w-full … px-6 py-4 flex items-center justify-between">`
  renders the brand + `Home / Interests / Listings` links **and** the right cluster (notification bell, wallet button, avatar, `Good Morning! Scarlet Johnson` greeting) as one non-wrapping row. At 375px the right cluster ends at x=446 → the whole document widens to 446px. There is no hamburger/drawer below `lg` (no `hidden md:*` / `flex-wrap` variants anywhere in `Navbar.tsx`).
- **Impact:** horizontal page scroll on **every** Phase 3 screen at mobile/tablet widths; the right-most control (user greeting) is initially off-screen.
- **Suggested fix:** collapse the link cluster and greeting behind a mobile menu trigger below `lg` (e.g. `hidden lg:flex` for the greeting/links + hamburger drawer), and/or allow the right cluster to wrap. **Design intent should be confirmed against the Figma responsive frames first.**

### R2 — `/notifications` is blank at every breakpoint (crash, not a layout issue)

- Console: `useNotificationSocket must be used within a NotificationSocketProvider` — `src/pages/notificationPage.tsx:102` calls the hook, but `NotificationSocketProvider` is **never mounted anywhere in the app** (only defined in `src/context/NotificationSocketContext.tsx` and referenced in tests). Introduced by `6d0b4f6` ("Add notification socket connection state indicators").
- There is no error boundary in `src/`, so the error unmounts the app → completely blank page (the three `notifications-*.png` files are empty white captures, ~2–5KB).
- **Impact:** the notifications screen cannot be reviewed or signed off at any breakpoint. Responsive QA for this screen is **blocked** until the provider is mounted (e.g. in `MainLayout`) or the error is otherwise fixed.

### R3 — Notification preferences endpoints 404 under MSW (dev-mock only)

- `GET /api/notifications/preferences` returns **404** on both preference screens at all widths; the pages render their error fallback instead of real toggle content.
- **Cause:** in `src/mocks/handlers/notify.ts` the generic `http.get("/api/notifications/:id")` (line 167) is registered **before** `http.get("**/api/notifications/preferences")` (line 196), so `preferences` is matched as a notification id and 404s.
- **Impact:** the preferences/settings screens can be captured for layout, but their populated state can't be verified against Figma in dev. This is a mock-ordering bug — it does not affect production API behavior. Fix: register the `preferences` routes before the `:id` route (or use a path that `:id` can't match).

### R4 — Settlement distribution grid never stacks on mobile

- `SettlementSummaryPage` uses `grid-cols-3` with **no responsive variant**: at 375px the Recipient/Amount/Share rows render as three 103px columns (`103px 103px 103px`), squeezing addresses/amounts.
- **Suggested fix:** `grid-cols-1 sm:grid-cols-3` (or a definition-list layout on mobile), pending Figma mobile-frame confirmation.

### R5 — What passed ✅

- **1280px (desktop): zero horizontal overflow on every screen**, no console errors, no failed requests on 9 of 11 screens (the two exceptions are R3).
- Data tables (`AdminApprovalQueuePage`, `AdminDisputeListPage`, dispute/approval lists) are wrapped in `overflow-x-auto` inside `overflow-hidden` cards → contained horizontal scroll instead of page-level overflow. Correct pattern.
- All screens except R2 render their expected H1 within 2s with mocked data; no page errors were thrown at any breakpoint.

## Figma matching status

Pixel-level comparison against Figma requires design-tool access that isn't available in this environment; this report therefore pairs **every screen × breakpoint** capture above for side-by-side review against [the Figma responsive frames](https://www.figma.com/design/avLyxNlVzfPjCft7sVrlzs/PETAD?node-id=373-4974):

| Status | Screens |
|--------|---------|
| 🟢 Ready for design-lead sign-off (#555) | adoption timeline, custody timeline, approval queues (admin + shelter), my disputes, dispute detail, admin disputes |
| 🟡 Captured — layout follow-up needed (R1 applies to all; R4 here) | settlement summary, notification preferences, notification settings |
| 🔴 Blocked — cannot be matched until fixed (R2) | notifications |

R1 (navbar) affects the top region of **every** screenshot, so header sign-off should wait for the R1 fix and a re-capture.

## Reproducing

```bash
VITE_MSW=true npm run dev -- --host 127.0.0.1 --port 4321   # terminal 1
node scripts/capture-responsive-screenshots.mjs             # terminal 2 (all widths)
node scripts/capture-responsive-screenshots.mjs 375          # or one breakpoint
```

The script prints one JSON line per screen with the horizontal-overflow measurement, console errors, and failed responses — usable as a regression check for R1/R4.
