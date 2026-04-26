import { useState, useEffect } from 'react';
import type { DisputeDetail } from '../pages/disputes/types';

export function useDisputeDetail(disputeId: string) {
  const [data, setData] = useState<DisputeDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);

    const mockData: DisputeDetail = {
      id: disputeId || "DSP-10293",
      raisedBy: {
        name: "Jane Doe",
        role: "ADOPTER",
      },
      reason: "Pet health issues not disclosed prior to adoption.",
      status: "UNDER_REVIEW",
      slaStatus: "AT_RISK",
      escrow: {
        status: "LOCKED",
        accountId: "GB3P...4XYZ",
      },
      evidence: [
        {
          id: "ev-1",
          fileName: "vet_report.pdf",
          url: "#",
          sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        },
        {
          id: "ev-2",
          fileName: "chat_logs.png",
          url: "#",
          sha256: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
        }
      ],
    };

    const timer = setTimeout(() => {
      setData(mockData);
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [disputeId]);

  return { data, isLoading };
}
