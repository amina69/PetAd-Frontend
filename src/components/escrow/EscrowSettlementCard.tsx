import { useState, useEffect, useRef } from "react";
import { useEscrowStatus } from "../../lib/hooks/useEscrowStatus";
import { type EscrowStatusData } from "./types";
import { EscrowStatusBadge } from "./EscrowStatusBadge";
import { Skeleton } from "../ui/Skeleton";
import { RefreshCw, AlertCircle } from "lucide-react";

interface EscrowSettlementCardProps {
  escrowId: string;
}

interface EscrowSettlementCardData {
  status?: string;
  balance?: number | string;
}

export function EscrowSettlementCard({ escrowId }: EscrowSettlementCardProps) {
  const { data, isLoading, isError, refetch } = useEscrowStatus(escrowId);
  const lastUpdatedRef = useRef<number>(0);
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  // Track last updated time when new data arrives
  useEffect(() => {
    if (data) {
      lastUpdatedRef.current = Date.now();
    }
  }, [data]);

  // Update secondsAgo every 10 seconds after lastUpdated changes
  useEffect(() => {
    const updateSecondsAgo = () => {
      if (lastUpdatedRef.current === 0) {
        return;
      }
      setSecondsAgo(Math.floor((Date.now() - lastUpdatedRef.current) / 1000));
    };

    updateSecondsAgo();
    const interval = setInterval(updateSecondsAgo, 10000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading && !data) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <Skeleton width="100px" height="24px" />
          <Skeleton width="80px" height="24px" />
        </div>
        <div className="mt-8 space-y-2">
          <Skeleton width="60%" height="48px" />
          <Skeleton width="40%" height="20px" />
        </div>
        <div className="mt-8">
          <Skeleton width="100%" height="16px" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="group w-full max-w-md overflow-hidden rounded-3xl border border-red-100 bg-white p-6 shadow-xl transition-all hover:shadow-2xl">
        <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
          <div className="rounded-full bg-red-50 p-3 text-red-500 ring-8 ring-red-50/50">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Failed to fetch escrow state</h3>
            <p className="mt-1 text-sm text-slate-500">Something went wrong while connecting to the network.</p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const escrowData = data as EscrowSettlementCardData | undefined;
  const balance =
    escrowData?.balance !== undefined && escrowData.balance !== null
      ? escrowData.balance
      : "0";
  const status =
    (escrowData?.status as EscrowStatusData["status"] | undefined) ??
    "AWAITING_FUNDS";

  return (
    <div className="group relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xl transition-all duration-500 hover:shadow-2xl">
      {/* Background radial highlight */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-50/50 blur-3xl transition-all duration-700 group-hover:bg-indigo-100/50" />
      
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Escrow State
          </span>
          <EscrowStatusBadge status={status as EscrowStatusData["status"]} />
        </div>

        <div className="mt-8">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight text-slate-900">
              {balance}
            </span>
            <span className="text-xl font-bold text-slate-400">XLM</span>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-500">Current Balance</p>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2 text-slate-400">
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              {isLoading ? "Updating..." : `Updated ${secondsAgo} seconds ago`}
            </span>
          </div>
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        </div>
      </div>
    </div>
  );
}
