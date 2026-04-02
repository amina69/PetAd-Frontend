import { useState } from "react";
import toast from "react-hot-toast";

export interface SubmitSignaturePayload {
  escrowId: string;
  publicKey: string;
}

/**
 * Mocks the signature submission process since the backend endpoint does not exist yet.
 */
export function useSubmitSignature() {
  const [isPending, setIsPending] = useState(false);

  const mutateSubmitSignature = async (
    _payload: SubmitSignaturePayload,
    onSuccess?: () => void
  ) => {
    setIsPending(true);
    try {
      // Simulate API call to stellar network
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Signature submitted successfully!");
      onSuccess?.();
    } catch {
      toast.error("Failed to submit signature.");
    } finally {
      setIsPending(false);
    }
  };

  return { mutateSubmitSignature, isPending };
}
