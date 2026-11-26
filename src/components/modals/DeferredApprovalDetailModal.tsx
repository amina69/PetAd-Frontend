import { lazy, Suspense, useState } from "react";
import type { ApprovalDetailModalProps } from "./ApprovalDetailModal";

const ApprovalDetailModal = lazy(() =>
  import("./ApprovalDetailModal").then((m) => ({ default: m.ApprovalDetailModal })),
);

type TriggerProps = Omit<ApprovalDetailModalProps, "isOpen" | "onClose"> & {
  children: (open: () => void) => React.ReactNode;
};

/**
 * Keeps ApprovalDetailModal out of the initial bundle.
 * The chunk is fetched only when the user triggers the modal for the first time.
 *
 * Usage:
 *   <DeferredApprovalDetailModal title="…" received={1} required={3} approvals={[]}>
 *     {(open) => <button onClick={open}>View approvals</button>}
 *   </DeferredApprovalDetailModal>
 */
export function DeferredApprovalDetailModal({ children, ...modalProps }: TriggerProps) {
  const [activated, setActivated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setActivated(true);
    setIsOpen(true);
  };

  return (
    <>
      {children(handleOpen)}
      {activated && (
        <Suspense fallback={null}>
          <ApprovalDetailModal
            {...modalProps}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}
