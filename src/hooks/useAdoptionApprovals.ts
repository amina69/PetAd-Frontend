import { useState, useCallback } from 'react';

export function useAdoptionApprovals() {
  const [hasDecided, setHasDecided] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Mocking required roles for this approval
  const requiredRoles = ['admin', 'manager', 'reviewer'];

  const mutateApprovalDecision = useCallback(() => {
    setIsPending(true);

    return new Promise<void>((resolve) => {
      // Simulate an API call
      setTimeout(() => {
        setIsPending(false);
        setHasDecided(true);
        resolve();
      }, 1000);
    });
  }, []);

  return {
    hasDecided,
    requiredRoles,
    mutateApprovalDecision,
    isPending
  };
}
