# Guest Browsing Mode

> Branch: `feat/guest-dashboard-access`

## Overview

PetAd supports a **guest browsing mode** that lets unauthenticated visitors explore public pages — including the homepage, pet listings, and listing detail pages — without requiring login. Interactive, state-changing actions (favouriting, expressing interest, creating listings, etc.) are **gated behind authentication** using a reusable interceptor pattern.

---

## Public Routes (Accessible to Guests)

| Route | Component | Notes |
|---|---|---|
| `/` | → redirects to `/home` | Root redirect changed from `/login` to `/home` |
| `/home` | `HomePage` | Pet listing section, hero, owner modal |
| `/listings` | `ListingsPage` | Browse all available pets |
| `/listings/:id` | `PetListingDetailsPage` | Pet details, gallery, owner info |

All three routes are wrapped in `PublicRoute` — a passthrough outlet that performs no auth check.

---

## Private Routes (Authentication Required)

All routes not listed above remain inside `ProtectedRoute` and redirect to `/login` for unauthenticated visitors:

- `/profile`, `/favourites`, `/interests`
- `/notifications`, `/notification-preferences`, `/settings/notifications`
- `/list-for-adoption`, `/my-listings/:id`
- `/adoption/:adoptionId/settlement|timeline`
- `/admin/approvals`, `/admin/disputes`
- `/shelter/approvals`
- `/disputes`, `/disputes/:id`
- `/custody/:custodyId/timeline`

---

## Authentication Gate (Interactive Actions)

### `AuthGateProvider` & `useAuthGate`

Wrap any subtree (currently the full app via `App.tsx`) with `<AuthGateProvider>`. This provides:

```tsx
const { requireAuth, replayAndClose, close, isOpen, reason, returnTo } = useAuthGate();
```

Call `requireAuth(reason, pendingAction?)` from any button to:
1. Prevent the action from firing.
2. Open the `AuthGateModal` with the reason text.
3. Store the `returnTo` path and an optional pending-action closure.

### `useAuthAction` Hook

The simplest way to gate any button:

```tsx
import { useAuthAction } from '../hooks/useAuthAction';

const handleFavourite = useAuthAction(
  () => saveToFavourites(petId),
  'Sign in to save pets to your favourites list.'
);

<button onClick={handleFavourite}>Add to Favourites</button>
```

- If authenticated → runs the callback immediately.
- If guest → opens `AuthGateModal` and stores the callback for potential replay.

### `AuthGateModal`

Rendered inside `MainLayout` so it overlays all pages. It shows:

- A reason for why auth is required.
- **"Sign In to Continue"** — redirects to `/login?returnTo=<current-path>` and stores the pending action hint in `sessionStorage`.
- **"Create Free Account"** — redirects to `/register?returnTo=<current-path>`.
- **"Continue browsing as guest"** — dismisses the modal.

---

## Return-to-Page After Login

After the user signs in, `SignInForm` reads the `returnTo` destination from:

1. **`?returnTo=` query parameter** (set by `AuthGateModal` redirect).
2. **`sessionStorage.petad_return_to`** (fallback).

The user is navigated back to the exact page they were viewing using `navigate(returnTo, { replace: true })`.

### Pending Action Restoration

Closures cannot be serialised across a full-page redirect. Instead:

- `sessionStorage.petad_pending_action_hint` stores a human-readable label (the `reason` string).
- After login the `SignInForm` shows a **"Sign in to continue: [action]"** banner confirming context.
- If the `AuthGateModal` is still open (same-page flow, no redirect), call `replayAndClose()` to execute the captured closure immediately.

---

## Guest Banner

`GuestBanner` is a subtle, dismissible sticky bar shown above the navbar to unauthenticated users:

> *"You're browsing as a guest. **Sign in** to save favourites, express interest, and more."*

- Hides automatically for authenticated users.
- Links to `/login?returnTo=<current-path>`.
- Dismissible via the ✕ button.

---

## Backend / MSW Endpoint Authorization

| Method | Endpoint | Auth Required | Notes |
|---|---|---|---|
| `GET` | `/api/listings` | ❌ No | Returns demo/public data |
| `GET` | `/api/listings/:id` | ❌ No | Returns public listing |
| `POST` | `/api/listings/:id/interest` | ✅ Yes | 401 if no Bearer token |
| `POST` | `/api/listings/:id/favourite` | ✅ Yes | 401 if no Bearer token |
| `POST` | `/api/listings` | ✅ Yes | Create listing — 401 if no token |
| `PUT` | `/api/listings/:id` | ✅ Yes | Update listing — 401 if no token |
| `DELETE` | `/api/listings/:id` | ✅ Yes | Delete listing — 401 if no token |

The MSW handler checks for a `Authorization: Bearer <token>` header. On a real backend, replace with your JWT middleware applied to mutation routes only.

---

## File Reference

| File | Purpose |
|---|---|
| `src/context/AuthGateContext.tsx` | Provider + `useAuthGate` hook, stores pending action + returnTo |
| `src/hooks/useAuthAction.ts` | Reusable hook to gate any callback behind auth |
| `src/components/auth/PublicRoute.tsx` | Passthrough route wrapper for guest-accessible pages |
| `src/components/auth/AuthGateModal.tsx` | Intercept modal shown on unauthenticated actions |
| `src/components/layout/GuestBanner.tsx` | Subtle sign-in nudge banner for guests |
| `src/components/layout/MainLayout.tsx` | Renders `GuestBanner` + `AuthGateModal` at layout level |
| `src/components/auth/SignInForm.tsx` | Reads `returnTo` + pending hint, restores navigation after login |
| `src/mocks/handlers/listings.ts` | MSW: public GETs + protected mutations |
| `src/App.tsx` | Updated routing with `PublicRoute` + `AuthGateProvider` |
| `src/components/auth/__tests__/GuestMode.test.tsx` | Comprehensive test suite |

---

## Security Notes

- No private or user-specific data is returned from public GET endpoints.
- All mutation endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) remain protected.
- The `ProtectedRoute` guard is unchanged — all existing private routes still redirect to `/login`.
- Guest browsing only exposes data that is already shown on the public listing pages (mock/demo data in development).

---

## Assumptions

1. This is a frontend-only project; "backend changes" are implemented via MSW mocks. The auth-check pattern (`Authorization: Bearer`) mirrors what a real API would enforce.
2. The `auth_token` in `localStorage` / `sessionStorage` is the sole source of authentication truth (as per the existing `useAuth` hook).
3. `UserDashboardPage` is not currently reachable from any route; it has not been changed.
4. Pending-action replay across a full-page redirect is provided as a UX hint only (the closure cannot be serialised); same-page replay via `replayAndClose()` is fully supported.
5. The `GuestBanner` is shown on all `MainLayout`-wrapped pages (public and protected alike) for guests, since it dismisses itself and authenticated users never see it.
