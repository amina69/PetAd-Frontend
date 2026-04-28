# useAdoptionApprovals Hook Implementation

## Overview
Custom React hook that fetches and polls adoption approval state, automatically stopping when quorum is reached.

## Files Created

### 1. Hook Implementation
**File:** `src/hooks/useAdoptionApprovals.ts`

**Features:**
- Fetches approval data from `GET /adoption/:id/approvals`
- Polls every 30 seconds while `quorumMet` is false
- Stops polling permanently once `quorumMet` becomes true
- Calculates `pending` count as `required - given`
- Only fetches when `adoptionId` is truthy

**Return Type:**
```typescript
interface AdoptionApprovalsResult {
  required: number;           // Total approvals needed
  given: number;              // Approvals received so far
  pending: number;            // Calculated: required - given
  quorumMet: boolean;         // True when given >= required
  escrowAccountId: string | null;  // Stellar account, null until quorum met
  isLoading: boolean;         // Query loading state
  isError: boolean;           // Query error state
}
```

**Usage:**
```typescript
const approvals = useAdoptionApprovals('adoption-123');

console.log(approvals.given, '/', approvals.required);
console.log('Pending:', approvals.pending);
console.log('Quorum met:', approvals.quorumMet);
```

### 2. MSW Mock Handlers
**File:** `src/mocks/handlers/adoptionApprovals.ts`

**Exports:**
- `preQuorumHandler(adoptionId)` - Returns pre-quorum state (given: 1, required: 3, quorumMet: false)
- `postQuorumHandler(adoptionId)` - Returns post-quorum state (given: 3, required: 3, quorumMet: true)
- Default export - Array with pre-quorum handler for global MSW setup

**Usage in Tests:**
```typescript
import { server } from '../../mocks/server';
import { preQuorumHandler, postQuorumHandler } from '../../mocks/handlers/adoptionApprovals';

// Override handler for specific test
server.use(postQuorumHandler('test-adoption-id'));
```

### 3. Unit Tests
**File:** `src/hooks/__tests__/useAdoptionApprovals.test.tsx`

**Test Coverage:**
1. ✅ Stops polling when quorumMet becomes true
2. ✅ Calculates pending correctly (required - given)
3. ✅ Does not fetch when adoptionId is empty
4. ✅ Sets isLoading true initially
5. ✅ Sets isError true on API failure

**Running Tests:**
```bash
npm test -- useAdoptionApprovals
# or
npx vitest run useAdoptionApprovals
```

## API Response Shapes

### Pre-Quorum Response
```json
{
  "required": 3,
  "given": 1,
  "quorumMet": false,
  "escrowAccountId": null
}
```

### Post-Quorum Response
```json
{
  "required": 3,
  "given": 3,
  "quorumMet": true,
  "escrowAccountId": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

## Implementation Details

### Polling Logic
The hook uses React Query's `refetchInterval` option with a function that inspects the current data:

```typescript
refetchInterval: (query) => {
  const data = query.state.data;
  if (data?.quorumMet) {
    return false; // Stop polling
  }
  return 30_000; // Poll every 30 seconds
}
```

### Data Transformation
The hook uses the `select` option to transform the API response and calculate the `pending` field:

```typescript
select: (data) => ({
  required: data.required,
  given: data.given,
  pending: data.required - data.given, // Calculated field
  quorumMet: data.quorumMet,
  escrowAccountId: data.escrowAccountId,
  isLoading: false,
  isError: false,
})
```

### Conditional Fetching
The query is only enabled when `adoptionId` is truthy:

```typescript
enabled: Boolean(adoptionId)
```

## Integration

The handlers are automatically registered in the global MSW setup via `src/mocks/handlers/index.ts`.

## Type Safety
- All types are properly exported
- No `any` types used
- Strict null checks enabled
- Full TypeScript support
