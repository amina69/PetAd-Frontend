# Approval

Multi-party approval of adoption requests: approvers (admin, shelter, reviewer
roles) record an `approve` / `reject` decision; an adoption advances once the
quorum is met. See the request/cache flow in
[`../architecture.md`](../architecture.md).

> Import paths in the snippets are relative to `src/` (the project has no `@/` alias).

| Piece | Location |
|-------|----------|
| Feature module (barrel) | `src/features/approval/` — `api/approvalService.ts`, `hooks/`, `schemas/`, `types/` |
| Components | `src/components/approval/` (`ApprovalStatusWidget`, `ApprovalStatusList`, `ApproverRow`, `ApprovalExpiryCountdown`), `src/components/adoption/ApproveRejectButtons`, `src/components/layout/ApprovalBanner` |
| Mutation / adoption-scoped hooks | `src/hooks/useMutateApprovalDecision.ts`, `useAdoptionApprovals.ts`, `usePendingApprovalsCount.ts` |
| Pages | `ApprovalListPage`, `AdminApprovalQueuePage`, `ShelterApprovalQueuePage` |
| Routes | `/admin/approvals`, `/shelter/approvals` (protected) |
| Mocks | `src/mocks/handlers/approval.ts` |

## Hook usage

List with filters (`["approvals", params]`, `staleTime` 60 s):

```tsx
import { useApprovalList } from "src/features/approval";

const { data, isLoading, isError, refetch } = useApprovalList({
  status: "PENDING",
  page: 1,
  limit: 20,
});
```

Detail (`["approvals", id]`). Renders instantly when the row is already in a
cached list page, then revalidates:

```tsx
import { useApprovalDetail } from "src/features/approval";

const { data: approval, isLoading } = useApprovalDetail(approvalId);
```

Cast a decision on an adoption. Optimistically updates the current user's row,
rolls back on error, then invalidates `["adoption", id]`, `["approvals", id]`
and `["timeline", id]`:

```tsx
import { useMutateApprovalDecision } from "src/hooks/useMutateApprovalDecision";

const { mutateAsync, isPending } = useMutateApprovalDecision(adoptionId);
await mutateAsync({ decision: "approved" });
await mutateAsync({ decision: "rejected", reason: "Home visit failed" });
```

Query-key helpers for manual invalidation: `approvalKeys.all`,
`approvalKeys.list(params)`, `approvalKeys.detail(id)`.

> Heads-up: `useAdoptionApprovals` is a local mock that drives the approval
> widget demo state; the server-backed paths are the hooks above.
