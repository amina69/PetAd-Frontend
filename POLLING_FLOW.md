# Polling Flow Diagram

## Hook Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│  useAdoptionApprovals('adoption-123')                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Initial State                                              │
│  • isLoading: true                                          │
│  • data: undefined                                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  First Fetch: GET /api/adoption/adoption-123/approvals     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Response Received                                          │
│  {                                                          │
│    required: 3,                                             │
│    given: 1,                                                │
│    quorumMet: false,                                        │
│    escrowAccountId: null                                    │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Transform Data (select)                                    │
│  • Calculate pending: 3 - 1 = 2                             │
│  • Add isLoading, isError flags                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Check Polling Condition (refetchInterval)                  │
│  • quorumMet === false                                      │
│  • Return 30000 (30 seconds)                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    ⏱️ Wait 30s
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Poll #1: GET /api/adoption/adoption-123/approvals         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Response: Still no quorum                                  │
│  { required: 3, given: 2, quorumMet: false, ... }           │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    ⏱️ Wait 30s
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Poll #2: GET /api/adoption/adoption-123/approvals         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Response: Quorum Reached! 🎉                               │
│  {                                                          │
│    required: 3,                                             │
│    given: 3,                                                │
│    quorumMet: true,                                         │
│    escrowAccountId: "GXXX...XXX"                            │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Check Polling Condition (refetchInterval)                  │
│  • quorumMet === true                                       │
│  • Return false (STOP POLLING)                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Final State                                                │
│  {                                                          │
│    required: 3,                                             │
│    given: 3,                                                │
│    pending: 0,                                              │
│    quorumMet: true,                                         │
│    escrowAccountId: "GXXX...XXX",                           │
│    isLoading: false,                                        │
│    isError: false                                           │
│  }                                                          │
│                                                             │
│  ⏹️ Polling stopped permanently                             │
└─────────────────────────────────────────────────────────────┘
```

## Key Decision Points

### 1. Should Fetch?
```typescript
enabled: Boolean(adoptionId)
```
- ✅ Fetch if adoptionId is truthy
- ❌ Don't fetch if adoptionId is empty/null/undefined

### 2. Should Poll?
```typescript
refetchInterval: (query) => {
  const data = query.state.data;
  if (data?.quorumMet) {
    return false; // STOP
  }
  return 30_000; // CONTINUE
}
```
- ✅ Poll every 30s if `quorumMet === false`
- ❌ Stop polling if `quorumMet === true`

### 3. Transform Data
```typescript
select: (data) => ({
  ...data,
  pending: data.required - data.given, // Calculate
  isLoading: false,
  isError: false,
})
```
- Calculate `pending` field
- Add loading/error flags

## Timeline Example

```
T=0s     Initial fetch → quorumMet: false (given: 1/3)
T=30s    Poll #1       → quorumMet: false (given: 1/3)
T=60s    Poll #2       → quorumMet: false (given: 2/3)
T=90s    Poll #3       → quorumMet: true  (given: 3/3) ✓
T=120s   No poll       → Polling stopped
T=150s   No poll       → Polling stopped
T=180s   No poll       → Polling stopped
...      No more polls → Polling stopped permanently
```

## State Transitions

```
┌──────────────┐
│   INITIAL    │
│ isLoading: T │
└──────┬───────┘
       │
       ↓
┌──────────────┐     30s      ┌──────────────┐     30s      ┌──────────────┐
│   POLLING    │ ──────────→  │   POLLING    │ ──────────→  │   POLLING    │
│ quorum: F    │              │ quorum: F    │              │ quorum: F    │
│ given: 1/3   │              │ given: 2/3   │              │ given: 2/3   │
└──────┬───────┘              └──────┬───────┘              └──────┬───────┘
       │                             │                             │
       │                             │                             ↓
       │                             │                      ┌──────────────┐
       │                             │                      │   QUORUM     │
       │                             │                      │   REACHED    │
       │                             │                      │ quorum: T    │
       │                             │                      │ given: 3/3   │
       │                             │                      │ escrow: GXXX │
       │                             │                      └──────────────┘
       │                             │                             │
       │                             │                             ↓
       │                             │                      ┌──────────────┐
       │                             │                      │   STOPPED    │
       │                             │                      │ No more polls│
       │                             │                      └──────────────┘
       │                             │
       ↓                             ↓
┌──────────────┐            ┌──────────────┐
│    ERROR     │            │    ERROR     │
│ isError: T   │            │ isError: T   │
└──────────────┘            └──────────────┘
```
