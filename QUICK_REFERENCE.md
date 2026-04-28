# Quick Reference: useAdoptionApprovals

## Import
```typescript
import { useAdoptionApprovals } from './hooks/useAdoptionApprovals';
```

## Basic Usage
```typescript
const approvals = useAdoptionApprovals('adoption-123');
```

## Return Values
```typescript
{
  required: number;           // e.g., 3
  given: number;              // e.g., 1
  pending: number;            // e.g., 2 (calculated: required - given)
  quorumMet: boolean;         // e.g., false
  escrowAccountId: string | null;  // null until quorum met
  isLoading: boolean;         // true while fetching
  isError: boolean;           // true on error
}
```

## Polling Behavior
- ⏱️ Polls every 30 seconds while `quorumMet === false`
- ⏹️ Stops automatically when `quorumMet === true`
- 🚫 Doesn't fetch if `adoptionId` is empty

## Testing with MSW

### Import Handlers
```typescript
import { preQuorumHandler, postQuorumHandler } from '../../mocks/handlers/adoptionApprovals';
import { server } from '../../mocks/server';
```

### Override Handler in Test
```typescript
// Pre-quorum state
server.use(preQuorumHandler('test-id'));

// Post-quorum state
server.use(postQuorumHandler('test-id'));
```

### Custom Handler
```typescript
import { http, HttpResponse } from 'msw';

server.use(
  http.get('*/api/adoption/my-id/approvals', () => {
    return HttpResponse.json({
      required: 5,
      given: 2,
      quorumMet: false,
      escrowAccountId: null,
    });
  })
);
```

## Common Patterns

### Show Progress
```typescript
const approvals = useAdoptionApprovals(adoptionId);
return <div>{approvals.given} / {approvals.required} approvals</div>;
```

### Conditional Rendering
```typescript
const approvals = useAdoptionApprovals(adoptionId);

if (approvals.quorumMet) {
  return <div>✓ Quorum reached! Escrow: {approvals.escrowAccountId}</div>;
}

return <div>⏳ Waiting for {approvals.pending} more approvals...</div>;
```

### Loading State
```typescript
const approvals = useAdoptionApprovals(adoptionId);

if (approvals.isLoading) return <Spinner />;
if (approvals.isError) return <Error />;

return <ApprovalStatus data={approvals} />;
```

## API Endpoint
```
GET /api/adoption/:id/approvals
```

### Response (Pre-Quorum)
```json
{
  "required": 3,
  "given": 1,
  "quorumMet": false,
  "escrowAccountId": null
}
```

### Response (Post-Quorum)
```json
{
  "required": 3,
  "given": 3,
  "quorumMet": true,
  "escrowAccountId": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

## Files
- Hook: `src/hooks/useAdoptionApprovals.ts`
- Handlers: `src/mocks/handlers/adoptionApprovals.ts`
- Tests: `src/hooks/__tests__/useAdoptionApprovals.test.tsx`
- Example: `src/components/adoption/ApprovalStatusExample.tsx`
