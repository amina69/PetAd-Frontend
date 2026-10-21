# Temporary Custody (Epic D)

The temporary custody feature lets a pet **owner** hand their pet over to a
**caretaker** for a period of time. The caretaker is paid out of the
adoption escrow, so the arrangement, its escrow and its timeline all belong
to the same domain.

This page documents the frontend side of the feature. The backlog items are
[#628](https://github.com/amina69/PetAd-Frontend/issues/628) (hooks),
[#629](https://github.com/amina69/PetAd-Frontend/issues/629) (request form),
[#630](https://github.com/amina69/PetAd-Frontend/issues/630) (date range
picker) and [#631](https://github.com/amina69/PetAd-Frontend/issues/631)
(dashboard).

## Routes

| Route | Screen |
| --- | --- |
| `/custody` | `CustodyDashboardPage` — Active / Upcoming / Past |
| `/pets/:petId/custody/new` | `CustodyRequestPage` — request a new arrangement |
| `/custody/:custodyId/timeline` | `CustodyTimelinePage` — the arrangement timeline |

The dashboard keeps the active tab and the page in the URL
(`/custody?tab=upcoming&page=2`).

## Query keys

The query-key factory lives in `src/features/custody/hooks/useCustodyList.ts`.

| Key | Holds |
| --- | --- |
| `["custody", params]` | the custody list, one entry per filter/page combination |
| `["custody", "availability", petId]` | the days a pet is already booked for |
| `["custody-detail", custodyId]` | one arrangement, with its escrow snapshot |

The list and the detail deliberately live under **separate roots** so that
every mutation can invalidate *exactly* the keys it affects:

| Mutation | Invalidated | Untouched |
| --- | --- | --- |
| `useRequestCustody` | every list variant, the created arrangement's detail | other details, escrow caches, other domains |
| `useExtendCustody` | every list variant, that arrangement's detail | other details, escrow caches, other domains |
| `useEndCustody` | every list variant, that arrangement's detail | other details, escrow caches, other domains |

`useRequestCustody` navigates to the arrangement it created
(`/custody/:custodyId/timeline`).

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/custody` | paginated list; `status` accepts a single status or a comma-separated list |
| `GET` | `/custody/availability` | the days a pet cannot be booked for |
| `GET` | `/custody/:id` | a single arrangement |
| `POST` | `/custody` | request an arrangement (409 on a date conflict) |
| `PATCH` | `/custody/:id/extend` | move the end date |
| `POST` | `/custody/:id/end` | end the arrangement early |
| `GET` | `/escrow/:id/status` | the existing escrow endpoint, read alongside the arrangement |

The escrow state of an arrangement is **always** read from the escrow
endpoint — it is never derived client-side from the arrangement's own status.

## Dates

A custody period is a range of **calendar days**, so every date in the
feature is a date-only string (`"YYYY-MM-DD"`). `src/lib/dateOnly.ts` holds
the helpers: they never use `new Date("2026-06-20")` (that is UTC midnight
and the previous day west of Greenwich) and they do their day arithmetic on
UTC calendar-day ordinals, so a daylight-saving switch cannot shift a day.

## The signed-in user

Deciding whether an arrangement is shown from the owner's or the caretaker's
side needs the id of the signed-in user. `useCustodyViewer`
(`src/features/custody/hooks/useCustodyViewer.ts`) reads it from the session
the sign-in form mirrors into `localStorage`.

It is a deliberately small, custody-scoped stand-in. When the shared
`useCurrentUser` hook ([#650](https://github.com/amina69/PetAd-Frontend/issues/650))
lands, `useCustodyViewer` should delegate to it — nothing else has to
change.
