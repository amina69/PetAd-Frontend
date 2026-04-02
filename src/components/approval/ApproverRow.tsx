import { CheckCircle2, Clock, User } from "lucide-react";
import { StellarTxLink } from "../ui/StellarTxLink";
import type { EscrowSignature } from "../../lib/hooks/useEscrowStatus";

export interface Approver {
  publicKey: string;
  name?: string;
}

export interface ApproverRowProps {
  approver: Approver;
  signatures: EscrowSignature[];
  currentUserPublicKey?: string;
}

export function ApproverRow({
  approver,
  signatures,
  currentUserPublicKey,
}: ApproverRowProps) {
  const hasSigned = signatures.some((s) => s.signer === approver.publicKey);
  const isCurrentUser = approver.publicKey === currentUserPublicKey;

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md"
      data-testid="approver-row"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            hasSigned ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
          }`}
        >
          {hasSigned ? <CheckCircle2 size={20} /> : <Clock size={20} />}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">
              {approver.name || "Approver"}
            </span>
            {isCurrentUser && (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10" data-testid="you-indicator">
                <User size={12} />
                You
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            <StellarTxLink id={approver.publicKey} type="account" className="font-normal" />
          </div>
        </div>
      </div>

      <div className="flex shrink-0">
        {hasSigned ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20" data-testid="status-signed">
            <CheckCircle2 size={14} />
            Signed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20" data-testid="status-pending">
            <Clock size={14} />
            Pending
          </span>
        )}
      </div>
    </div>
  );
}
