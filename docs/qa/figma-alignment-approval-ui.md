# QA Report — Approval UI vs. Design System / Figma (Epic I, issue #550)

**Issue:** [#550 Epic I — Design System & Figma Alignment (Frontend QA)](https://github.com/amina69/PetAd-Frontend/issues/550) — *I1. Compare Approval UI against latest Figma frames*
**Date:** 2026-09-29 · **Auditor:** @Michealshodipo56 · **Status:** code-level findings complete — pixel side-by-side pending design-team inputs (see §5)

---

## 1. Scope

Approval UI surfaces audited (all approval-related code reachable from the app shell):

| Surface | Route / location |
|---|---|
| Admin approval queue | `/admin/approvals` → `src/pages/AdminApprovalQueuePage.tsx` |
| Shelter approval queue | `/shelter/approvals` → `src/pages/ShelterApprovalQueuePage.tsx` |
| Approval list | `src/pages/ApprovalListPage.tsx` *(unrouted — see D11)* |
| Approval status list | `src/components/approval/ApprovalStatusList.tsx` |
| Quorum widget | `src/components/approval/ApprovalStatusWidget.tsx` |
| Expiry countdown | `src/components/approval/ApprovalExpiryCountdown.tsx` |
| Approve / reject buttons | `src/components/adoption/ApproveRejectButtons/ApproveRejectButtons.tsx` |
| Approval history tab | `src/components/adoption/ApprovalHistoryTab.tsx` |
| Pending-approvals badge | `src/components/badges/PendingApprovalBadge.tsx` |
| Approval banner | `src/components/layout/ApprovalBanner.tsx` |
| Rejection reason modal | `src/components/modals/RejectionReasonModal.tsx` |

**Design references available in this repository:**

- Figma file **PETAD** — `figma.com/design/avLyxNlVzfPjCft7sVrlzs/PETAD` (historical `design.txt`, removed from `main`)
- Figma file **PetAds-Designs (dark mode)** — `figma.com/design/0fDeq4qUYjt95MQTlaQbNC/PetAds-Designs` (indexed by `src/figma/*.txt`)
- In-repo design system: `src/index.css` (`.status-badge` utility family, CSS custom properties) and the canonical badge component `src/components/ui/StatusBadge.tsx`
- App theme contract: `src/components/theme-provider.tsx` toggles `.dark` / `.light` on `<html>` (incl. system preference)

**Method:** line-by-line code audit of every approval surface against the in-repo design system, the token system, WCAG 2.1 AA, and the dark-mode contract established by the theme provider and the Figma dark-mode frame index. Pixel-level side-by-side against Figma frames could not be produced in this environment (§5).

---

## 2. Findings — discrepancy list

Each finding is written so it can be filed as its own sub-issue. Severity: **H** = high, **M** = medium, **L** = low.

| # | Severity | Finding | Primary evidence |
|---|---|---|---|
| D1 | H | Brand hex values hard-coded in TSX; no design tokens; two different "brand oranges" | `AdminApprovalQueuePage.tsx:61,65,85,111` · `ApprovalListPage.tsx:93` |
| D2 | H | Status badges: 5 hand-rolled styles bypass the canonical `StatusBadge` used by every other domain | `ApprovalStatusList.tsx:77` · `ApprovalStatusWidget.tsx:91-101` · `AdminApprovalQueuePage.tsx:184` · `ApprovalListPage.tsx:243` · `ApprovalHistoryTab.tsx:112` |
| D3 | H | Zero dark-mode coverage on all approval surfaces despite a shipped theme toggle | 0 × `dark:` across all 11 files; fixed `bg-white` / `bg-[#F8FAFC]` / `text-[#0D162B]` |
| D4 | H | WCAG AA contrast failures on status/SLA pills and avatar initials | `AdminApprovalQueuePage.tsx:188,205` · `ApprovalHistoryTab.tsx:73` |
| D5 | M | Non-interactive controls lack semantics: toggle, row navigation, banner dismiss | `AdminApprovalQueuePage.tsx:110,146` · `ApprovalBanner.tsx:44` |
| D6 | M | Rejection success copy says "approval recorded" | `ApproveRejectButtons.tsx:36` |
| D7 | L | Dead `group-hover:` style (no `group` ancestor) | `ApprovalStatusWidget.tsx:117` |
| D8 | L | Asymmetric width notations on the Approve/Reject pair | `ApproveRejectButtons.tsx:49` (`min-w-25`) vs `:62` (`min-w-[100px]`) |
| D9 | L | Quorum widget divides by zero when `required = 0` → `width: NaN%` | `ApprovalStatusWidget.tsx:31-34` |
| D10 | — | Process blocker: no approval frames indexed in `src/figma/*.txt`; pixel side-by-side needs frame links | `src/figma/*.txt`, git-history `design.txt` |
| D11 | M | `ApprovalListPage` is unrouted — its states are unreachable in the product | imported only by `src/pages/__tests__/ApprovalListPage.test.tsx` |

### D1 — Brand hex values hard-coded; no design tokens (High)

The palette `#E84D2A` (brand orange), `#0D162B` (ink), `#F8FAFC` (page background), `#FFF2E5` (hover wash) appears **13×** in `AdminApprovalQueuePage.tsx`, **4×** in `ApprovalListPage.tsx`, **7×** in `ShelterApprovalQueuePage.tsx`, **3×** in `RejectionReasonModal.tsx`, **1×** in `ApprovalHistoryTab.tsx` — and **0×** in `src/index.css`. The design system defines no such tokens, so the brand color cannot be changed centrally and drifts per screen.

Worse, sibling approval screens already disagree on the primary: the admin queue uses `bg-[#E84D2A]` (`AdminApprovalQueuePage.tsx:111,196`) while the approval list retry button uses Tailwind `bg-orange-600` (`ApprovalListPage.tsx:93`) — `#ea580c` ≠ `#e84d2a`, visibly different oranges on two approval screens.

**Recommendation:** define brand tokens in `src/index.css` (e.g. `--color-brand`, `--color-ink`, `--color-surface`) and consume them via theme utilities; replace `bg-orange-600` with the brand token.

### D2 — Five hand-rolled status badge styles bypass `StatusBadge` (High)

The design system ships `.status-badge--{gray,blue,teal,green,amber,red}` utilities (`src/index.css`) and a canonical component `src/components/ui/StatusBadge.tsx`. Every other domain uses it: disputes (`DisputeStatusBadge.tsx`), escrow (`EscrowStatusBadge.tsx`), custody, adoption.

The approval domain uses it **nowhere**, rendering the same states five different ways:

1. `ApprovalStatusList.tsx:77` — `rounded-full bg-green-50 px-2.5 py-1 ring-1 ring-green-600/20` (+90-line variants)
2. `ApprovalStatusWidget.tsx:91-101` — `rounded-full bg-green-100 text-green-600 px-2 py-1`
3. `AdminApprovalQueuePage.tsx:184` — `rounded-md bg-green-50 px-2 py-1` (square radius!)
4. `ApprovalListPage.tsx:243` — `rounded-full text-[10px] uppercase bg-green-50`
5. `ApprovalHistoryTab.tsx:112` — `rounded-full border border-green-200 px-3 py-1`

One state ("Approved") therefore renders with four radii (`md`/`full`), three paddings, two greens (`green-700` vs `green-600`) and two sizes (`text-xs` vs `text-[10px]`) across approval screens. The two-step statuses (`SHELTER_APPROVED`, `ADMIN_APPROVED` in `AdminApprovalQueuePage.tsx:8-12`) also have no badge mapping — they reuse generic green — while the token family offers unused colors (`blue`, `teal`) for the two approval stages.

**Recommendation:** replace all five with `<StatusBadge color="…" label="…" icon={…} />`; map `SHELTER_APPROVED → blue`, `ADMIN_APPROVED → green`, `REJECTED → red`, `PENDING → amber`.

### D3 — Zero dark-mode coverage (High)

`theme-provider.tsx` sets `.dark` on `<html>` (system preference included) and the shell implements dark styles (`Navbar.tsx`, `MainLayout.tsx`, `theme-toggle.tsx` — the only files in `src/components|pages` containing `dark:` variants). Every one of the 11 approval surfaces contains **0 `dark:` variants** and pins light-only values: `bg-white` cards (Admin ×4, ApprovalList ×3, Shelter ×1, modal ×2, history ×2), `bg-[#F8FAFC]` page backgrounds, `text-slate-900` / `text-[#0D162B]` headings, `bg-amber-100 border-amber-300` banner (`ApprovalBanner.tsx:32`), `text-slate-600` countdown (`ApprovalExpiryCountdown.tsx:97`).

**Result:** toggling the shipped theme renders approval screens as glaring light islands inside a dark shell. The dark-mode Figma frames indexed in `src/figma/*.txt` confirm dark variants are part of the design system.

**Recommendation:** add `dark:` variants (or token-driven surfaces) across the approval surfaces; prioritize the page backgrounds, cards, and banner.

### D4 — WCAG AA contrast failures (High)

- `AdminApprovalQueuePage.tsx:205` — "On Track" pill: `text-gray-400` on `bg-gray-100` ≈ **2.2:1** (AA requires 4.5:1; text is `text-[10px]`)
- `AdminApprovalQueuePage.tsx:188` — "Pending" cell pill: `text-gray-400` on `bg-gray-50` ≈ **2.3:1**
- `ApprovalHistoryTab.tsx:73` — approver initials: `text-gray-400` on `bg-gray-50` ≈ **2.3:1**
- Non-dark-mode `text-slate-400` + `opacity-60` pending rows (`ApprovalStatusList.tsx:143-147`) drop effective contrast further

**Recommendation:** use `gray-600`/`gray-700` equivalents; the `.status-badge` tokens already encode accessible pairs.

### D5 — Controls without semantics (Medium)

- **Overdue toggle** (`AdminApprovalQueuePage.tsx:108-117`): a `<div onClick>` — no `role="switch"`, no `aria-checked`, not keyboard focusable.
- **Queue row navigation** (`AdminApprovalQueuePage.tsx:145-147`): `<tr onClick>` — no `tabIndex`, no Enter-key handler; the primary navigation of the admin queue is mouse-only.
- **Banner dismiss** (`ApprovalBanner.tsx:40-46`): bare `✕` text in a button with only `className="font-bold"` — no `aria-label="Dismiss"`, inconsistent with the lucide-icon + `aria-label` pattern used elsewhere (`RejectionReasonModal.tsx:161` gets this right).

**Recommendation:** `<button role="switch" aria-checked>`, keyboard-accessible rows (or a link/action cell), `aria-label` on the dismiss control.

### D6 — Wrong copy on rejection (Medium)

`ApproveRejectButtons.tsx:36` — rejecting a request fires `toast.success("Your approval has been recorded")` (identical to the approve path at line 26). Design copy intent: rejection confirmation.

**Recommendation:** `toast.success("Your rejection has been recorded")`.

### D7 — Dead hover style (Low)

`ApprovalStatusWidget.tsx:117` — `group-hover:-translate-y-0.5` on the Stellar link, but no ancestor carries `group` (the card at line 24 does not) — the hover affordance never activates.

### D8 — Inconsistent width notations (Low)

`ApproveRejectButtons.tsx:49` uses `min-w-25` while its pair at line 62 uses `min-w-[100px]`. Both resolve to 100px today, but the mixed notation invites drift when the design changes one button.

### D9 — Quorum division by zero (Low)

`ApprovalStatusWidget.tsx:31-34` — `percentage = Math.round((received / required) * 100)` yields `NaN` when `required = 0`, producing `style={{ width: "NaN%" }}` on the progress bar.

### D10 — Missing Figma frame index (process blocker)

Neither `src/figma/*.txt` nor the git-history `design.txt` indexes any approval-queue frame (node-ids cover login, listings, notifications, disputes, settlement, etc.). A pixel-accurate side-by-side requires the design team to supply the approval frame links (see §5).

### D11 — ApprovalListPage unrouted (Medium)

`src/pages/ApprovalListPage.tsx` (266 lines, full loading/empty/error states, tab filters) is imported only by its test — no route in `src/App.tsx` renders it. Either a route is missing or the page is dead code; product decision needed.

---

## 3. Proposed sub-issues

Ready to file from this report (acceptance criteria suggested):

1. **D1** — Tokenize brand palette; remove hard-coded hex from approval screens
2. **D2** — Migrate approval status pills to canonical `StatusBadge` (incl. two-stage approval colors)
3. **D3** — Dark-mode coverage for all approval surfaces
4. **D4** — Fix WCAG AA contrast failures on approval pills/initials
5. **D5** — Accessibility semantics: overdue toggle, queue rows, banner dismiss
6. **D6** — Correct rejection confirmation copy
7. **D7+D8+D9** — Approval UI cleanups (dead hover class, width notation, quorum divide-by-zero)
8. **D11** — Decide routing fate of `ApprovalListPage`
9. **D10** — Index approval Figma frames in `src/figma/`

---

## 4. What already matches the design system (for sign-off context)

- Loading/empty/error states are complete and consistent on both queues (`Skeleton`, `EmptyState`, retry) — `AdminApprovalQueuePage.tsx:127-143`, `ShelterApprovalQueuePage.tsx:50-70`, `ApprovalListPage.tsx:196-215`
- `RejectionReasonModal` is exemplary on a11y: `role="dialog"`, `aria-modal`, `aria-labelledby`, labelled close button (`RejectionReasonModal.tsx:150-161`)
- `ApprovalStatusList` uses proper list semantics (`aria-label` on `ul`/`li`, `data-testid` hooks)
- `ApprovalStatusWidget` progress bar exposes `role="progressbar"` + `aria-valuenow/min/max`
- Filter tabs use `role="tablist"` / `role="tab"` / `aria-selected` (`ApprovalListPage.tsx:175-186`)
- Status filter chips, skeletons, and empty-state copy reuse shared `src/components/ui` primitives

---

## 5. Pixel side-by-side checklist (pending design team)

Blocked in this environment: no runnable browser for screenshots, and no approval frame links indexed (D10). Once frame links are provided, capture and attach to this issue:

**Capture matrix** (light + dark themes):

| Route | Viewports | States |
|---|---|---|
| `/admin/approvals` | 1440px, 390px | loading, populated, empty, error+retry, overdue-filtered, SLA-breached row |
| `/shelter/approvals` | 1440px, 390px | loading, populated, empty, error |
| approval surfaces in context | 1440px | `ApprovalStatusList` in adoption detail, `ApprovalStatusWidget` quorum states, `ApprovalBanner`, `PendingApprovalBadge`, `RejectionReasonModal` open, approve/reject pending spinners |

**Side-by-side format:** `[Figma frame | app screenshot]` per surface, annotated with each D-number where they diverge, attached to issue #550.

---

## 6. Acceptance criteria status

- [x] Approval UI surfaces inventoried and audited against the design system
- [x] Discrepancy list produced (D1–D11, §2) with proposed sub-issues (§3)
- [ ] Side-by-side screenshots attached to issue #550 — **blocked** on approval frame links (D10) + screenshot capture (§5)
- [ ] Design team sign-off comment recorded on issue #550 — **pending** the above
