# Dispute

Users and shelters raise disputes against an adoption or custody record, attach
evidence, and an admin resolves them by splitting the escrow between shelter and
adopter. SLA badges flag overdue disputes. See
[`../architecture.md`](../architecture.md) for the cache flow.

> Import paths in the snippets are relative to `src/` (the project has no `@/` alias).

| Piece | Location |
|-------|----------|
| Feature module | `src/features/disputes/` (preferred): `api/disputeService.ts`, `hooks/useCreateDispute.ts`, `schemas/disputeSchemas.ts`, `types/`, `constants/disputeStatusConfig.ts`. `src/features/dispute/` is an older duplicate (see architecture §6). |
| Components | `src/components/dispute/` (thread, evidence, SLA/status badges), `src/components/disputes/` (`RaiseDisputeTrigger`, `AdminDisputeResolutionForm`), `src/components/badges/` |
| Hooks | `src/hooks/useDisputes.ts`, `useDisputeDetail.ts`, `useMutateRaiseDispute.ts`, `useResolveDispute.ts`, `src/lib/hooks/useDisputeCount.ts` |
| Pages / routes | `/disputes` (`MyDisputesPage`), `/disputes/:id` (`DisputeDetailPage`), `/admin/disputes` (`AdminDisputeListPage`) |
| Mocks | `src/mocks/handlers/dispute.ts` |

## Hook usage

Paginated list (`["disputes", { status, overdue }]`, cursor-based):

```tsx
import { useDisputes } from "src/hooks/useDisputes";

const { disputes, isLoadingMore, fetchNextPage, hasNextPage } =
  useDisputes({ status: "open", overdue: true });
```

Detail with enriched resolution data (`["dispute-detail", id]`):

```tsx
import { useDisputeDetail } from "src/hooks/useDisputeDetail";

const { data, isLoading, isNotFound, isForbidden } = useDisputeDetail(disputeId);
```

Create a dispute. `createDispute` validates against `disputeFormSchema`; it
returns `false` and fills `fieldErrors` on invalid input, otherwise it submits,
invalidates `["disputes"]` and navigates to `/disputes/:id`:

```tsx
import { useCreateDispute } from "src/features/disputes/hooks/useCreateDispute";

const { createDispute, fieldErrors, clearFieldErrors, isPending } = useCreateDispute();
const dispatched = createDispute({ adoptionOrCustodyId, reason, description });
```

Raise a dispute with evidence upload and progress (multipart via XHR):

```tsx
import { useMutateRaiseDispute } from "src/hooks/useMutateRaiseDispute";

const raise = useMutateRaiseDispute({ onProgress: (pct) => setProgress(pct) });
raise.mutate(payload); // invalidates ["disputes"] and ["adoption", adoptionId]
```

Admin resolution (shelter/adopter percentages):

```tsx
import { useResolveDispute } from "src/hooks/useResolveDispute";

const resolve = useResolveDispute();
resolve.mutate({ disputeId, shelterPercent: 70, adopterPercent: 30 });
```
