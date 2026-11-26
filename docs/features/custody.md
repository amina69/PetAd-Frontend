# Custody

Temporary custody: an owner hands a pet to a caretaker for a bounded period
(max 90 days, notes max 500 chars), optionally escrow-backed. Lifecycle:
`requested → approved → active → completed`, with `cancelled` and `disputed`
as side exits. See [`../architecture.md`](../architecture.md).

> Import paths in the snippets are relative to `src/` (the project has no `@/` alias).

| Piece | Location |
|-------|----------|
| Feature module | `src/features/custody/` — `types/`, `schemas/custodySchemas.ts` (zod: `custodyRequestSchema`, `custodyArrangementSchema`, `custodyListResponseSchema`) |
| Service | `src/api/custodyService.ts` — `getDetails`, `getTimeline`, `getCustodyList`, `getCustodyById`, `requestCustody`, `extendCustody`, `endCustody`; throws typed errors for overlapping dates |
| Hooks | `src/lib/hooks/useCustodyDetails.ts`, `useCustodyTimeline.ts` |
| Components | `src/components/custody/` — `CustodyStatusBadge`, `CustodyExpiringBanner` |
| Page / route | `CustodyTimelinePage` at `/custody/:custodyId/timeline` |
| Mocks | `src/mocks/handlers/custody.ts` |

## Hook usage

Details (`["custody-details", id]`, `staleTime` 30 s; disabled while `id` is
undefined):

```tsx
import { useCustodyDetails } from "src/lib/hooks/useCustodyDetails";

const { data, isLoading, isError } = useCustodyDetails(custodyId);
```

Timeline (`["custody-timeline", id]`). Event types include `CREATED`, `FUNDED`,
`DISPUTED`, `PAUSED`, `SETTLED`, `SETTLEMENT_FAILED`; events with
`stellarExplorerUrl` render an explorer link:

```tsx
import { useCustodyTimeline } from "src/lib/hooks/useCustodyTimeline";

const timeline = useCustodyTimeline(custodyId, { enabled: tabIsOpen });
```

Request custody. Validate with the schema, then call the service:

```tsx
import { custodyRequestSchema } from "src/features/custody";
import { custodyService } from "src/api/custodyService";

const request = custodyRequestSchema.parse(formValues);
const arrangement = await custodyService.requestCustody(request);
```
