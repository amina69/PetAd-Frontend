import { useState, useEffect } from "react";

export type AdoptionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "DISPUTED";

export interface Adoption {
  id: string;
  petName: string;
  applicantName: string;
  status: AdoptionStatus;
  date: string;
}

const MOCK_ADOPTIONS: Adoption[] = [
  { id: "1", petName: "Bella", applicantName: "John Doe", status: "PENDING", date: "2023-10-01" },
  { id: "2", petName: "Max", applicantName: "Jane Smith", status: "APPROVED", date: "2023-10-02" },
  { id: "3", petName: "Luna", applicantName: "Alice Johnson", status: "REJECTED", date: "2023-10-03" },
  { id: "4", petName: "Charlie", applicantName: "Bob Brown", status: "DISPUTED", date: "2023-10-04" },
  { id: "5", petName: "Milo", applicantName: "Eve White", status: "PENDING", date: "2023-10-05" },
  { id: "6", petName: "Buddy", applicantName: "Michael Green", status: "DISPUTED", date: "2023-10-06" },
  { id: "7", petName: "Lucy", applicantName: "Sarah Black", status: "DISPUTED", date: "2023-10-07" },
  { id: "8", petName: "Daisy", applicantName: "Tom Clark", status: "APPROVED", date: "2023-10-08" },
];

export interface UseAdoptionListOptions {
  status: AdoptionStatus[];
}

export interface UseAdoptionListResult {
  data: Adoption[];
  isLoading: boolean;
  counts: Record<AdoptionStatus, number>;
}

export function useAdoptionList({ status }: UseAdoptionListOptions): UseAdoptionListResult {
  const [data, setData] = useState<Adoption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Compute counts dynamically based on all data (not just filtered)
  const counts = MOCK_ADOPTIONS.reduce(
    (acc, adoption) => {
      acc[adoption.status] = (acc[adoption.status] || 0) + 1;
      return acc;
    },
    { PENDING: 0, APPROVED: 0, REJECTED: 0, DISPUTED: 0 } as Record<AdoptionStatus, number>
  );

  const statusKey = status.join(",");

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const timer = setTimeout(() => {
      if (isMounted) {
        let filtered = MOCK_ADOPTIONS;
        const currentStatus = statusKey ? (statusKey.split(",") as AdoptionStatus[]) : [];
        if (currentStatus.length > 0) {
          filtered = MOCK_ADOPTIONS.filter((adoption) => currentStatus.includes(adoption.status));
        }
        setData(filtered);
        setIsLoading(false);
      }
    }, 500); // Simulate API delay

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [statusKey]); // Re-run when status array changes

  return { data, isLoading, counts };
}
