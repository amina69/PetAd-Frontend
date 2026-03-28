import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useResolveDispute } from "../../hooks/useResolveDispute";
import { toast } from "react-hot-toast";

type Props = {
  disputeId: string;
  totalAmount: number; // total XLM in escrow
};

export default function AdminDisputeResolutionForm({
  disputeId,
  totalAmount,
}: Props) {
  const queryClient = useQueryClient();

  const [shelterPercent, setShelterPercent] = useState(60);
  const [adopterPercent, setAdopterPercent] = useState(40);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync, isPending } = useResolveDispute();

  const shelterAmount = (shelterPercent / 100) * totalAmount;
  const adopterAmount = (adopterPercent / 100) * totalAmount;

  const isValid =
    shelterPercent >= 0 &&
    adopterPercent >= 0 &&
    shelterPercent + adopterPercent === 100;

  // Step 1 → Validate and show confirmation
  const handleContinue = () => {
    if (!isValid) {
      setError("Percent split must equal 100%");
      return;
    }
    setError(null);
    setShowConfirmation(true);
  };

  // Step 2 → Final submit
  const handleConfirm = async () => {
    try {
      await mutateAsync({
        disputeId,
        shelterPercent,
        adopterPercent,
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      queryClient.invalidateQueries({ queryKey: ["adoptions"] });

      // Success feedback
      toast.success("Dispute resolved");
    } catch (err: unknown) {
      setError(
    err instanceof Error ? err.message : "Failed to resolve dispute"
  );
    }
  };

  return (
    <div>
      <h2>Resolve Dispute</h2>

      {/* STEP 1: INPUT */}
      {!showConfirmation && (
        <>
          <div>
            <label>Shelter %</label>
            <input
              type="number"
              value={shelterPercent}
              onChange={(e) => setShelterPercent(Number(e.target.value))}
            />
          </div>

          <div>
            <label>Adopter %</label>
            <input
              type="number"
              value={adopterPercent}
              onChange={(e) => setAdopterPercent(Number(e.target.value))}
            />
          </div>

          <button onClick={handleContinue}>Continue</button>
        </>
      )}

      {/* STEP 2: CONFIRMATION */}
      {showConfirmation && (
        <div>
          <h3>Confirmation</h3>

          <p>
            Shelter: {shelterPercent}% ({shelterAmount} XLM)
          </p>
          <p>
            Adopter: {adopterPercent}% ({adopterAmount} XLM)
          </p>

          <p style={{ color: "red" }}>
            This will release the escrow on Stellar. This cannot be undone.
          </p>

          <button onClick={handleConfirm} disabled={isPending}>
            Confirm & Submit
          </button>
        </div>
      )}

      {/* ERROR */}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}