# PR Description — Issue #430 A2

> Purpose: paste the content below the horizontal rule into the pull-request
> description when opening the PR for branch
> `feat/430-a2-approval-zod-schemas`.

---

## Summary

Implements **Issue #430 A2 — Add Zod schemas for Approval payloads**. Adds runtime-validated Zod schemas for approval API responses and the rejection-reason payload, wires them into the API service layer and the rejection form, and adds full test coverage.

## Issue ↔ repository naming mapping

The issue text references `approvalService.ts` and an `ApprovalRequest` type; **neither exists in this repository**. This PR maps the issue onto the actual codebase artifacts:

| Issue reference | Actual repository artifact |
| --- | --- |
| `approvalService.ts` | `src/api/adoptionService.ts` (`getApprovals`, `getAdminApprovalQueue`) |
| `ApprovalRequest` | `ApprovalDecision` — `src/types/adoption.ts` |
| A10 approval form | `RejectionReasonModal` — `src/components/modals/RejectionReasonModal.tsx` |

## What changed

1. **New `src/features/approval/schemas/approvalSchemas.ts`**
   - `approvalResponseSchema` — field-for-field mirror of `ApprovalDecision` (`id`, `approverName`, `approverRole`, `status` enum `["APPROVED","REJECTED","EXPIRED"]`, `reason?`, `timestamp`, `txHash?`). Optional fields intentionally reject `null` (undefined only).
   - `rejectRequestSchema` — `reason: z.string().min(20, "Please provide at least 20 characters explaining the rejection")`
   - `adminApprovalQueueItemSchema` / `adminApprovalQueueResponseSchema` — mirror of `AdminApprovalQueueItem` + pagination envelope (`nextCursor: z.string().nullable().optional()`).
   - All types exported via `z.infer` — no duplicated manual types.
2. **`src/api/adoptionService.ts`** — runtime validation before data reaches hooks:
   - `getApprovals`: `approvalResponseSchema.array().parse(data)`
   - `getAdminApprovalQueue`: `adminApprovalQueueResponseSchema.parse(data)`
3. **`RejectionReasonModal.tsx`** — replaced the manual length check with `rejectRequestSchema.safeParse`; the Zod issue for path `["reason"]` is rendered as an inline field error under the textarea and gates the submit button.
4. **`ApproveRejectButtons.tsx`** — `handleReject` now forwards the reason: `mutateApprovalDecision({ decision: "REJECTED", reason })`.
5. **`package.json` / `pnpm-lock.yaml`** — add `zod ^4.4.3` (zod was referenced by the README but was not previously a dependency).

## Acceptance criteria

| Criterion | Status | Evidence |
| --- | --- | --- |
| `rejectRequestSchema.safeParse({ reason: 'too short' })` fails with message `"Please provide at least 20 characters explaining the rejection"` on path `["reason"]` | ✅ PASS | `approvalSchemas.test.ts` — exact-message + path assertions |
| `approvalResponseSchema` parses **every** approval API response before it is returned to hooks | ✅ PASS | Both approval-returning service methods (`getApprovals`, `getAdminApprovalQueue`) apply runtime `.parse()`; no other method returns an approval response |

## Tests

- **New** `src/features/approval/schemas/approvalSchemas.test.ts` (11 tests): acceptance case, exact message, `reason` path, missing field, optional-vs-null behavior, unknown status, queue envelope (`null` / missing `nextCursor`, invalid item).
- **Updated** `ApproveRejectButtons.test.tsx`: asserts the rejection payload `{ decision: "REJECTED", reason }` end-to-end.

Run locally:

```bash
pnpm vitest run src/features/approval/schemas/approvalSchemas.test.ts \
  src/components/adoption/ApproveRejectButtons/ApproveRejectButtons.test.tsx
# 2 files, 17/17 passed

npx tsc --noEmit -p tsconfig.app.json
# clean
```

## Scope

All 8 changed files serve Issue #430 A2 only — no config changes, no unrelated refactors. The only new dependency is `zod`, which the issue requires.

## Non-blocking notes (candidates for follow-up issues)

- `AdminApprovalQueueItem` in `src/types/adoption.ts` is now unreferenced and can be removed in a later cleanup.
- `useMutateApprovalDecision` (pre-existing, unused by the wired flow) posts to `/adoption/:id/approve` without schema validation — future alignment candidate.
