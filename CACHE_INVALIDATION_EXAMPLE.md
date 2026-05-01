# Cache Invalidation Examples

## Overview
This document provides examples of how to manually invalidate the approvals badge cache to ensure the UI stays responsive when approvals are processed.

## When to Invalidate Cache

You should invalidate the badge cache in these scenarios:
1. After approving an adoption request
2. After rejecting an adoption request
3. After bulk processing approvals
4. When navigating to the approvals page (optional, for freshness)
5. After any action that changes the pending approvals count

## Basic Invalidation

### In a Component
```typescript
import { useQueryClient } from '@tanstack/react-query';

function ApprovalActionButton() {
  const queryClient = useQueryClient();

  const handleApprove = async (adoptionId: string) => {
    try {
      await approvalService.approve(adoptionId);
      
      // Invalidate the badge cache to trigger immediate refetch
      queryClient.invalidateQueries(['shelter', 'approvals', 'pending-count']);
      
      toast.success('Approval processed successfully');
    } catch (error) {
      toast.error('Failed to process approval');
    }
  };

  return (
    <button onClick={() => handleApprove('adoption-123')}>
      Approve
    </button>
  );
}
```

### In a Custom Hook
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adoptionService } from '../api/adoptionService';

export function useApproveAdoption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adoptionId: string) => adoptionService.approve(adoptionId),
    onSuccess: () => {
      // Invalidate badge cache
      queryClient.invalidateQueries(['shelter', 'approvals', 'pending-count']);
      
      // Also invalidate the approvals list if you have one
      queryClient.invalidateQueries(['shelter', 'approvals', 'list']);
    },
  });
}

// Usage in component
function ApprovalCard({ adoptionId }: { adoptionId: string }) {
  const { mutate: approve, isPending } = useApproveAdoption();

  return (
    <button 
      onClick={() => approve(adoptionId)}
      disabled={isPending}
    >
      {isPending ? 'Processing...' : 'Approve'}
    </button>
  );
}
```

## Advanced Patterns

### Optimistic Updates
Update the UI immediately before the API call completes:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useApproveAdoption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adoptionId: string) => adoptionService.approve(adoptionId),
    
    // Optimistically update the count before API responds
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(['shelter', 'approvals', 'pending-count']);

      // Snapshot the previous value
      const previousCount = queryClient.getQueryData(['shelter', 'approvals', 'pending-count']);

      // Optimistically update to new value
      queryClient.setQueryData(['shelter', 'approvals', 'pending-count'], (old: any) => ({
        ...old,
        count: Math.max(0, (old?.count || 0) - 1),
      }));

      // Return context with snapshot
      return { previousCount };
    },
    
    // If mutation fails, rollback
    onError: (err, variables, context) => {
      if (context?.previousCount) {
        queryClient.setQueryData(
          ['shelter', 'approvals', 'pending-count'],
          context.previousCount
        );
      }
    },
    
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries(['shelter', 'approvals', 'pending-count']);
    },
  });
}
```

### Batch Operations
When processing multiple approvals at once:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useBulkApproveAdoptions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adoptionIds: string[]) => 
      Promise.all(adoptionIds.map(id => adoptionService.approve(id))),
    
    onSuccess: (data, adoptionIds) => {
      // Invalidate badge cache once after all approvals
      queryClient.invalidateQueries(['shelter', 'approvals', 'pending-count']);
      
      toast.success(`${adoptionIds.length} approvals processed`);
    },
  });
}
```

### Page-Level Invalidation
Invalidate when navigating to the approvals page:

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

function AdminApprovalQueuePage() {
  const queryClient = useQueryClient();

  // Refresh badge count when page loads
  useEffect(() => {
    queryClient.invalidateQueries(['shelter', 'approvals', 'pending-count']);
  }, [queryClient]);

  return (
    <div>
      <h1>Pending Approvals</h1>
      {/* Approvals list */}
    </div>
  );
}
```

## Real-World Integration Examples

### Example 1: Admin Approval Queue Page
```typescript
// src/pages/AdminApprovalQueuePage.tsx
import { useQueryClient } from '@tanstack/react-query';
import { useApproveAdoption } from '../hooks/useApproveAdoption';

function AdminApprovalQueuePage() {
  const queryClient = useQueryClient();
  const { mutate: approve } = useApproveAdoption();

  const handleApprove = (adoptionId: string) => {
    approve(adoptionId, {
      onSuccess: () => {
        // Badge will auto-update via invalidation in the hook
        // Optionally refresh the list
        queryClient.invalidateQueries(['admin', 'approvals', 'queue']);
      },
    });
  };

  return (
    <div>
      {/* Approval cards with approve buttons */}
    </div>
  );
}
```

### Example 2: Approval Modal
```typescript
// src/components/modals/ApprovalModal.tsx
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { adoptionService } from '../api/adoptionService';

function ApprovalModal({ adoptionId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await adoptionService.approve(adoptionId);
      
      // Invalidate badge cache
      queryClient.invalidateQueries(['shelter', 'approvals', 'pending-count']);
      
      toast.success('Approval processed');
      onClose();
    } catch (error) {
      toast.error('Failed to process approval');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await adoptionService.reject(adoptionId);
      
      // Invalidate badge cache
      queryClient.invalidateQueries(['shelter', 'approvals', 'pending-count']);
      
      toast.success('Approval rejected');
      onClose();
    } catch (error) {
      toast.error('Failed to reject approval');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal">
      <h2>Process Approval</h2>
      <button onClick={handleApprove} disabled={isProcessing}>
        Approve
      </button>
      <button onClick={handleReject} disabled={isProcessing}>
        Reject
      </button>
    </div>
  );
}
```

### Example 3: Using Existing AdminDisputeResolutionForm
```typescript
// Update src/components/disputes/AdminDisputeResolutionForm.tsx
import { useQueryClient } from '@tanstack/react-query';

function AdminDisputeResolutionForm({ disputeId }: Props) {
  const queryClient = useQueryClient();

  const handleSubmit = async (data: ResolutionData) => {
    try {
      await disputeService.resolve(disputeId, data);
      
      // If resolving a dispute affects pending approvals, invalidate
      queryClient.invalidateQueries(['shelter', 'approvals', 'pending-count']);
      
      toast.success('Dispute resolved');
    } catch (error) {
      toast.error('Failed to resolve dispute');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## Testing Cache Invalidation

### Test Example
```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApproveAdoption } from '../useApproveAdoption';

describe('useApproveAdoption', () => {
  it('should invalidate badge cache on success', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useApproveAdoption(), { wrapper });

    result.current.mutate('adoption-123');

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith([
        'shelter',
        'approvals',
        'pending-count',
      ]);
    });
  });
});
```

## Debugging Cache Issues

### Check Current Cache Value
```typescript
import { useQueryClient } from '@tanstack/react-query';

function DebugComponent() {
  const queryClient = useQueryClient();

  const checkCache = () => {
    const data = queryClient.getQueryData(['shelter', 'approvals', 'pending-count']);
    console.log('Current badge count:', data);
  };

  return <button onClick={checkCache}>Check Cache</button>;
}
```

### Force Refetch
```typescript
import { useQueryClient } from '@tanstack/react-query';

function ForceRefreshButton() {
  const queryClient = useQueryClient();

  const forceRefresh = () => {
    queryClient.refetchQueries(['shelter', 'approvals', 'pending-count']);
  };

  return <button onClick={forceRefresh}>Force Refresh Badge</button>;
}
```

### Clear All Cache
```typescript
import { useQueryClient } from '@tanstack/react-query';

function ClearCacheButton() {
  const queryClient = useQueryClient();

  const clearCache = () => {
    queryClient.clear();
  };

  return <button onClick={clearCache}>Clear All Cache</button>;
}
```

## Best Practices

1. **Always invalidate after mutations**: Any action that changes pending approvals should invalidate the cache
2. **Use optimistic updates for better UX**: Update the UI immediately, rollback on error
3. **Batch invalidations**: When processing multiple items, invalidate once at the end
4. **Test invalidation logic**: Ensure cache is properly invalidated in tests
5. **Consider stale time**: The 5-minute stale time means manual invalidation is important for immediate updates

## Common Pitfalls

❌ **Don't forget to invalidate**
```typescript
// BAD: Badge won't update
const handleApprove = async () => {
  await adoptionService.approve(id);
  // Missing invalidation!
};
```

✅ **Always invalidate**
```typescript
// GOOD: Badge updates immediately
const handleApprove = async () => {
  await adoptionService.approve(id);
  queryClient.invalidateQueries(['shelter', 'approvals', 'pending-count']);
};
```

❌ **Don't invalidate too frequently**
```typescript
// BAD: Invalidating on every render
useEffect(() => {
  queryClient.invalidateQueries(['shelter', 'approvals', 'pending-count']);
}); // Missing dependency array!
```

✅ **Invalidate strategically**
```typescript
// GOOD: Only invalidate when needed
const handleApprove = async () => {
  await adoptionService.approve(id);
  queryClient.invalidateQueries(['shelter', 'approvals', 'pending-count']);
};
```

## Summary

- Invalidate cache after any action that changes pending approvals count
- Use `queryClient.invalidateQueries(['shelter', 'approvals', 'pending-count'])`
- Consider optimistic updates for better UX
- Test invalidation logic in your tests
- The badge will automatically refetch and update when cache is invalidated
