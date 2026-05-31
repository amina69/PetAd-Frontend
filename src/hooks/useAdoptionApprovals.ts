import { useState, useCallback, useEffect, useRef } from 'react';

export function useAdoptionApprovals(adoptionId: string) {
  const [hasDecided, setHasDecided] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [quorumMet, setQuorumMet] = useState(false);
  
  // Mocking required roles for this approval
  const requiredRoles = ['admin', 'manager', 'reviewer'];
  
  // Polling logic
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const startPolling = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      // Mock API call check
      if (quorumMet) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }, 5000);
  }, [quorumMet]);
  
  useEffect(() => {
    if (!quorumMet) {
      startPolling();
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [quorumMet, startPolling]);

  const mutateApprovalDecision = useCallback((payload?: { decision: "APPROVED" | "REJECTED"; reason?: string }) => {
    console.log(`[Mock] mutateApprovalDecision for ${adoptionId}:`, payload);
    setIsPending(true);

    return new Promise<void>((resolve) => {
      // Simulate an API call
      setTimeout(() => {
        setIsPending(false);
        setHasDecided(true);
        // Simulate that this decision met the quorum for demo purposes
        if (payload?.decision === 'APPROVED') {
          setQuorumMet(true);
        }
        resolve();
      }, 1000);
    });
  }, [adoptionId]);

  return {
    hasDecided,
    requiredRoles,
    mutateApprovalDecision,
    isPending,
    quorumMet,
    setQuorumMet // exposed for testing / mock data setting
  };
}

  // Issues Implemented

  