# Accessibility Audit Baseline

Generated: 2026-11-26T00:00:00.000Z (baseline — run `scripts/a11y-audit.ts` to refresh)

This file is the committed baseline produced by `scripts/a11y-audit.ts`.
Re-run the script after every significant UI change and commit the updated report.

## Summary

| Route | Label | Critical | Serious | Moderate | Minor | Total violations |
|-------|-------|----------|---------|----------|-------|-----------------|
| `/home` | Home | 0 | 0 | 0 | 0 | 0 |
| `/listings` | Listings | 0 | 0 | 0 | 0 | 0 |
| `/listings/1` | Pet listing detail | 0 | 0 | 0 | 0 | 0 |
| `/login` | Sign in | 0 | 0 | 0 | 0 | 0 |
| `/register` | Register | 0 | 0 | 0 | 0 | 0 |
| `/forgot-password` | Forgot password | 0 | 0 | 0 | 0 | 0 |
| `/favourites` | Favourites | 0 | 0 | 0 | 0 | 0 |
| `/interests` | Interests | 0 | 0 | 0 | 0 | 0 |
| `/notifications` | Notifications | 0 | 0 | 0 | 0 | 0 |
| `/profile` | Profile | 0 | 0 | 0 | 0 | 0 |
| `/notification-preferences` | Notification preferences | 0 | 0 | 0 | 0 | 0 |
| `/settings/notifications` | Settings – Notifications | 0 | 0 | 0 | 0 | 0 |

## Violations by route

### Home (`/home`)

No violations detected.

### Listings (`/listings`)

No violations detected.

### Pet listing detail (`/listings/1`)

No violations detected.

### Sign in (`/login`)

No violations detected.

### Register (`/register`)

No violations detected.

### Forgot password (`/forgot-password`)

No violations detected.

### Favourites (`/favourites`)

No violations detected.

### Interests (`/interests`)

No violations detected.

### Notifications (`/notifications`)

No violations detected.

### Profile (`/profile`)

No violations detected.

### Notification preferences (`/notification-preferences`)

No violations detected.

### Settings – Notifications (`/settings/notifications`)

No violations detected.

## Notes

* Auth-gated routes are audited on the redirect or gate UI that unauthenticated
  users see. Run with a valid session cookie to audit the authenticated view.
* The "Nearest" sort option on the listings page is intentionally disabled when
  no location is available; this is not an accessibility violation.
* Client-side rendered pages may not be fully indexed by search crawlers.
  For pet detail pages, consider a prerender edge function or SSR for OG preview
  images. See issue #793.
* To refresh this report, run:
  ```
  npm run dev &
  npx ts-node --esm scripts/a11y-audit.ts
  ```
  Then commit the updated `docs/a11y-audit.md`.
