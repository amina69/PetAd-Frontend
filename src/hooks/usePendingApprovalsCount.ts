import { useEffect, useState } from "react";

export const usePendingApprovalsCount = () => {
  const [count, setCount] = useState(0);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/shelter/approvals?status=PENDING&limit=0")
      .then((res) => res.json())
      .then((data) => setCount(data?.count || 0))
      .catch(() => setCount(0))
      .finally(() => setLoading(false));
  }, []);

  return { count, isLoading };
};