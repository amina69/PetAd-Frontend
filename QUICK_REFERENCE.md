# Approvals Badge - Quick Reference

## 🚀 Quick Start

### Set User Role
```javascript
// In browser console or app initialization
localStorage.setItem('petad_user_role', 'admin');    // Shows badge
localStorage.setItem('petad_user_role', 'shelter');  // Shows badge
localStorage.setItem('petad_user_role', 'user');     // No badge
```

### Invalidate Cache (Force Update)
```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
queryClient.invalidateQueries(['shelter', 'approvals', 'pending-count']);
```

## 📋 Badge Display Rules

| Count | Display | Example |
|-------|---------|---------|
| 0     | Hidden  | (no badge) |
| 1     | "1"     | ① |
| 5     | "5"     | ⑤ |
| 9     | "9"     | ⑨ |
| 10    | "9+"    | 9+ |
| 100   | "9+"    | 9+ |

## 🔐 Role Access Matrix

| Role    | Badge Visible | API Called | Approvals Link |
|---------|---------------|------------|----------------|
| ADMIN   | ✅            | ✅         | ✅             |
| SHELTER | ✅            | ✅         | ✅             |
| USER    | ❌            | ❌         | ❌             |

## 📁 Key Files

### Production Code
```
src/
├── api/
│   └── shelterService.ts              # API service
├── hooks/
│   ├── usePendingApprovalsCount.ts    # Main hook
│   └── useRoleGuard.ts                # Role checking
└── components/
    └── layout/
        ├── Navbar.tsx                 # Badge display
        └── ApprovalBanner.tsx         # Banner component
```

### Tests
```
src/
├── hooks/
│   └── __tests__/
│       └── usePendingApprovalsCount.test.tsx
└── components/
    └── layout/
        └── __tests__/
            ├── Navbar.test.tsx
            └── ApprovalBanner.test.tsx
```

## 🧪 Run Tests

```bash
# All tests
npm test

# Specific tests
npm test -- usePendingApprovalsCount
npm test -- Navbar.test
npm test -- ApprovalBanner.test

# With coverage
npm test -- --coverage
```

## ⚙️ Configuration

### Polling Settings
```typescript
{
  staleTime: 5 * 60 * 1000,        // 5 minutes
  refetchInterval: 5 * 60 * 1000,  // 5 minutes
  refetchOnWindowFocus: true,      // Refresh on focus
  enabled: isAuthorized            // Only if admin/shelter
}
```

### API Endpoint
```
GET /shelter/approvals?status=PENDING&limit=0

Response: { count: number }
```

## 🎨 Styling

```typescript
// Badge classes
className="
  flex items-center justify-center
  min-w-[20px] h-5 px-1.5
  text-[11px] font-bold
  text-white bg-red-500
  rounded-full
"
```

## ♿ Accessibility

```typescript
// ARIA label format
aria-label={`${count} pending approval${count !== 1 ? 's' : ''}`}

// Examples:
// "1 pending approval"
// "5 pending approvals"
```

## 🔧 Common Tasks

### Add Badge to New Component
```typescript
import { useRoleGuard } from '../hooks/useRoleGuard';
import { usePendingApprovalsCount } from '../hooks/usePendingApprovalsCount';

function MyComponent() {
  const { role } = useRoleGuard();
  const { count } = usePendingApprovalsCount(role);
  
  return <span>{count}</span>;
}
```

### Invalidate After Action
```typescript
import { useQueryClient } from '@tanstack/react-query';

function ApprovalButton() {
  const queryClient = useQueryClient();
  
  const handleApprove = async () => {
    await approvalService.approve(id);
    queryClient.invalidateQueries(['shelter', 'approvals', 'pending-count']);
  };
  
  return <button onClick={handleApprove}>Approve</button>;
}
```

### Check Current Count
```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
const data = queryClient.getQueryData(['shelter', 'approvals', 'pending-count']);
console.log('Current count:', data?.count);
```

## 🐛 Troubleshooting

### Badge Not Showing
1. Check role: `localStorage.getItem('petad_user_role')`
2. Verify count > 0
3. Ensure role is 'admin' or 'shelter'

### Badge Not Updating
1. Check if 5 minutes have passed
2. Try manual invalidation
3. Check network tab for API calls

### API Not Called
1. Verify role is 'admin' or 'shelter'
2. Check React Query DevTools
3. Ensure `enabled` condition is true

## 📊 Test Coverage

- **Total Tests**: 24
- **Hook Tests**: 6
- **Navbar Tests**: 10
- **Banner Tests**: 8
- **Coverage**: >95%

## 🔗 Related Documentation

- [APPROVALS_BADGE_IMPLEMENTATION.md](./APPROVALS_BADGE_IMPLEMENTATION.md) - Full implementation guide
- [BADGE_VISUAL_GUIDE.md](./BADGE_VISUAL_GUIDE.md) - Visual specifications
- [CACHE_INVALIDATION_EXAMPLE.md](./CACHE_INVALIDATION_EXAMPLE.md) - Cache management
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Complete summary

## 💡 Tips

1. **Performance**: Badge only fetches for authorized users
2. **Freshness**: Refetches on window focus for immediate updates
3. **Testing**: Mock the hook in component tests
4. **Debugging**: Use React Query DevTools
5. **Invalidation**: Always invalidate after mutations

## 📞 Support

For issues or questions:
1. Check diagnostics: `getDiagnostics(['path/to/file'])`
2. Review test files for usage examples
3. Check browser console for errors
4. Verify localStorage role value
5. Inspect network tab for API calls

---

**Quick Links**
- API Service: `src/api/shelterService.ts`
- Main Hook: `src/hooks/usePendingApprovalsCount.ts`
- Badge Display: `src/components/layout/Navbar.tsx`
- Tests: `src/**/__tests__/*.test.tsx`
