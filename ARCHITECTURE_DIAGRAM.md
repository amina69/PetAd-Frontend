# Approvals Badge Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Navbar Component                       │  │
│  │                                                           │  │
│  │  Home  Interests  Listings  Approvals [5]  ← Badge      │  │
│  │                                              ↑            │  │
│  └──────────────────────────────────────────────┼────────────┘  │
│                                                  │               │
└──────────────────────────────────────────────────┼───────────────┘
                                                   │
                                                   │
┌──────────────────────────────────────────────────┼───────────────┐
│                      React Hooks Layer           │               │
│                                                  │               │
│  ┌────────────────────────────────────────────┐ │               │
│  │        usePendingApprovalsCount            │ │               │
│  │                                            │ │               │
│  │  • Accepts user role                      │ │               │
│  │  • Conditionally enables fetching         │ │               │
│  │  • Returns count, loading, error          │ │               │
│  │  • Polls every 5 minutes                  │ │               │
│  └────────────────┬───────────────────────────┘ │               │
│                   │                             │               │
│  ┌────────────────┴───────────────────────────┐ │               │
│  │           useRoleGuard                     │ │               │
│  │                                            │ │               │
│  │  • Reads localStorage                     │ │               │
│  │  • Returns role, isAdmin, isShelter       │ │               │
│  └────────────────────────────────────────────┘ │               │
│                                                  │               │
└──────────────────────────────────────────────────┼───────────────┘
                                                   │
                                                   │
┌──────────────────────────────────────────────────┼───────────────┐
│                  React Query Layer               │               │
│                                                  │               │
│  ┌────────────────────────────────────────────┐ │               │
│  │           useApiQuery Wrapper              │ │               │
│  │                                            │ │               │
│  │  • Wraps @tanstack/react-query            │ │               │
│  │  • Handles errors (401, 403, 404)         │ │               │
│  │  • Manages caching & polling              │ │               │
│  │  • Key: ['shelter', 'approvals', ...]     │ │               │
│  └────────────────┬───────────────────────────┘ │               │
│                   │                             │               │
└───────────────────┼─────────────────────────────────────────────┘
                    │
                    │
┌───────────────────┼─────────────────────────────────────────────┐
│              API Service Layer                  │               │
│                                                 │               │
│  ┌────────────────┴───────────────────────────┐│               │
│  │           shelterService                   ││               │
│  │                                            ││               │
│  │  getPendingApprovalsCount()               ││               │
│  │    ↓                                       ││               │
│  │  apiClient.get('/shelter/approvals?...')  ││               │
│  └────────────────┬───────────────────────────┘│               │
│                   │                            │               │
└───────────────────┼────────────────────────────────────────────┘
                    │
                    │ HTTP GET
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API                                │
│                                                                 │
│  GET /shelter/approvals?status=PENDING&limit=0                 │
│                                                                 │
│  Response: { count: 5 }                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Initial Load
```
User Opens App
    ↓
Navbar Renders
    ↓
useRoleGuard() → Reads localStorage → Returns role
    ↓
usePendingApprovalsCount(role)
    ↓
Check: role === 'admin' || role === 'shelter'?
    ↓
YES: Enable Query          NO: Return count = 0, skip API
    ↓
useApiQuery()
    ↓
shelterService.getPendingApprovalsCount()
    ↓
apiClient.get('/shelter/approvals?status=PENDING&limit=0')
    ↓
Backend API
    ↓
Response: { count: 5 }
    ↓
React Query Cache
    ↓
Badge Displays: "5"
```

### 2. Polling (Every 5 Minutes)
```
5 Minutes Elapsed
    ↓
React Query Auto-Refetch
    ↓
shelterService.getPendingApprovalsCount()
    ↓
Backend API
    ↓
Response: { count: 3 }
    ↓
React Query Cache Updated
    ↓
Badge Updates: "3"
```

### 3. Window Focus
```
User Returns to Tab
    ↓
React Query Detects Focus
    ↓
Trigger Refetch
    ↓
Backend API
    ↓
Response: { count: 7 }
    ↓
Badge Updates: "7"
```

### 4. Manual Invalidation
```
User Approves Request
    ↓
Component Calls: queryClient.invalidateQueries([...])
    ↓
React Query Marks Cache as Stale
    ↓
Trigger Immediate Refetch
    ↓
Backend API
    ↓
Response: { count: 4 }
    ↓
Badge Updates: "4"
```

## Component Hierarchy

```
App
 └── MainLayout
      └── Navbar
           ├── useRoleGuard()
           │    └── localStorage.getItem('petad_user_role')
           │
           └── usePendingApprovalsCount(role)
                ├── useApiQuery()
                │    ├── @tanstack/react-query
                │    └── shelterService.getPendingApprovalsCount()
                │         └── apiClient.get()
                │
                └── Returns: { count, isLoading, isError }
                     └── Badge Renders if count > 0
```

## State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                      Application State                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  localStorage                                            │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  petad_user_role: "admin" | "shelter" | "user"     │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Query Cache                                       │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  Key: ['shelter', 'approvals', 'pending-count']    │ │  │
│  │  │  Data: { count: 5 }                                │ │  │
│  │  │  Status: 'success' | 'loading' | 'error'           │ │  │
│  │  │  StaleTime: 300000ms (5 minutes)                   │ │  │
│  │  │  RefetchInterval: 300000ms (5 minutes)             │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Role-Based Access Control

```
┌─────────────────────────────────────────────────────────────────┐
│                      Role Check Flow                            │
│                                                                 │
│  User Role?                                                     │
│      │                                                          │
│      ├─── "admin" ──────┐                                      │
│      │                  │                                      │
│      ├─── "shelter" ────┤                                      │
│      │                  │                                      │
│      └─── "user" ───────┤                                      │
│                         │                                      │
│                         ↓                                      │
│              ┌──────────────────────┐                          │
│              │  isAuthorized?       │                          │
│              └──────────┬───────────┘                          │
│                         │                                      │
│              ┌──────────┴───────────┐                          │
│              │                      │                          │
│             YES                    NO                          │
│              │                      │                          │
│              ↓                      ↓                          │
│    ┌─────────────────┐    ┌─────────────────┐                │
│    │ • Show Badge    │    │ • Hide Badge    │                │
│    │ • Enable API    │    │ • Disable API   │                │
│    │ • Show Link     │    │ • Hide Link     │                │
│    │ • Start Polling │    │ • No Polling    │                │
│    └─────────────────┘    └─────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

## Badge Display Logic

```
┌─────────────────────────────────────────────────────────────────┐
│                    Badge Rendering Logic                        │
│                                                                 │
│  count value?                                                   │
│      │                                                          │
│      ├─── 0 ──────────────→ Hide Badge                         │
│      │                                                          │
│      ├─── 1 to 9 ─────────→ Display Exact Number               │
│      │                      (e.g., "1", "5", "9")              │
│      │                                                          │
│      └─── 10+ ────────────→ Display "9+"                       │
│                              (e.g., 10, 100, 999 all show "9+")│
│                                                                 │
│  Accessibility:                                                 │
│      aria-label = `${count} pending approval${plural}`         │
│                                                                 │
│  Styling:                                                       │
│      • Red background (#ef4444)                                │
│      • White text                                              │
│      • Circular shape (min-w-[20px], rounded-full)            │
│      • Bold font (11px)                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Cache Invalidation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  Cache Invalidation Triggers                    │
│                                                                 │
│  1. User Action (Approve/Reject)                               │
│      ↓                                                          │
│  Component calls:                                              │
│      queryClient.invalidateQueries([...])                      │
│      ↓                                                          │
│  React Query marks cache as stale                              │
│      ↓                                                          │
│  Immediate refetch triggered                                   │
│      ↓                                                          │
│  Badge updates with new count                                  │
│                                                                 │
│  2. Time-Based (5 minutes)                                     │
│      ↓                                                          │
│  React Query auto-refetch                                      │
│      ↓                                                          │
│  Badge updates with new count                                  │
│                                                                 │
│  3. Window Focus                                               │
│      ↓                                                          │
│  User returns to tab                                           │
│      ↓                                                          │
│  React Query detects focus                                     │
│      ↓                                                          │
│  Refetch triggered                                             │
│      ↓                                                          │
│  Badge updates with new count                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Testing Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Test Structure                           │
│                                                                 │
│  Unit Tests                                                     │
│  ├── usePendingApprovalsCount.test.tsx (6 tests)              │
│  │   ├── Unauthorized user (no API call)                      │
│  │   ├── Admin user (API called)                              │
│  │   ├── Shelter user (API called)                            │
│  │   ├── Count = 0                                            │
│  │   ├── API error handling                                   │
│  │   └── Null role handling                                   │
│  │                                                             │
│  ├── Navbar.test.tsx (10 tests)                               │
│  │   ├── Role-based link visibility                           │
│  │   ├── Badge display rules (0, 1-9, 10+)                   │
│  │   ├── Aria-label correctness                              │
│  │   └── Styling verification                                 │
│  │                                                             │
│  └── ApprovalBanner.test.tsx (8 tests)                        │
│      ├── Role-based banner visibility                         │
│      ├── Count display                                        │
│      ├── Dismiss functionality                                │
│      └── Link verification                                    │
│                                                                 │
│  Test Utilities                                                │
│  ├── Mock shelterService                                      │
│  ├── Mock useRoleGuard                                        │
│  ├── Mock usePendingApprovalsCount                            │
│  └── QueryClient wrapper                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Performance Optimizations

```
┌─────────────────────────────────────────────────────────────────┐
│                   Performance Features                          │
│                                                                 │
│  1. Conditional Fetching                                       │
│     • enabled: isAuthorized                                    │
│     • No API calls for unauthorized users                      │
│     • Saves network bandwidth                                  │
│                                                                 │
│  2. Caching Strategy                                           │
│     • staleTime: 5 minutes                                     │
│     • Data considered fresh for 5 minutes                      │
│     • No refetch during fresh period                           │
│                                                                 │
│  3. Smart Polling                                              │
│     • refetchInterval: 5 minutes                               │
│     • Balanced freshness vs server load                        │
│     • Only polls for authorized users                          │
│                                                                 │
│  4. Window Focus Optimization                                  │
│     • refetchOnWindowFocus: true                               │
│     • Ensures fresh data when user returns                     │
│     • Better UX without constant polling                       │
│                                                                 │
│  5. React Query Benefits                                       │
│     • Automatic deduplication                                  │
│     • Request cancellation                                     │
│     • Background refetching                                    │
│     • Optimistic updates support                               │
└─────────────────────────────────────────────────────────────────┘
```

## Error Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                      Error Flow                                 │
│                                                                 │
│  API Request                                                    │
│      ↓                                                          │
│  ┌───────────────────────────────────────┐                     │
│  │  Response Status?                     │                     │
│  └───────┬───────────────────────────────┘                     │
│          │                                                      │
│  ┌───────┼───────┬───────────┬──────────┐                     │
│  │       │       │           │          │                     │
│ 200    401     403         404        5xx                     │
│  │       │       │           │          │                     │
│  ↓       ↓       ↓           ↓          ↓                     │
│ OK   Redirect  Forbidden  NotFound   Error                    │
│  │    to Login    │           │          │                     │
│  │       │        │           │          │                     │
│  ↓       ↓        ↓           ↓          ↓                     │
│ Badge  Clear   Return     Return     Return                   │
│ Shows  Token   Error      Error      Error                    │
│        │        │           │          │                     │
│        └────────┴───────────┴──────────┘                     │
│                 │                                              │
│                 ↓                                              │
│        Badge shows count = 0                                  │
│        isError = true                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    System Integration                           │
│                                                                 │
│  Navbar Component                                              │
│      ↕                                                          │
│  ApprovalBanner Component                                      │
│      ↕                                                          │
│  usePendingApprovalsCount Hook                                 │
│      ↕                                                          │
│  Admin Approval Queue Page                                     │
│      ↕                                                          │
│  Approval Action Components                                    │
│      ↕                                                          │
│  Cache Invalidation                                            │
│      ↕                                                          │
│  Badge Auto-Update                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

This architecture ensures:
- ✅ Efficient data fetching with caching
- ✅ Role-based access control
- ✅ Automatic updates via polling
- ✅ Manual refresh capability
- ✅ Comprehensive error handling
- ✅ Optimal performance
- ✅ Testable components
