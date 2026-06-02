import { useMemo } from "react";
import { apiClient } from "../lib/api-client";
import { useApiQuery } from "./useApiQuery";
import type { DisputeDetail, DisputeResolution } from "../pages/disputes/types";

interface DisputeDetailApiResponse extends Omit<DisputeDetail, "resolution"> {
  resolution?: {
    type?: string;
    adminNote?: string;
    resolvedBy?: string;
    resolvedAt?: string;
    txHash?: string;
    splitDistribution?: DisputeResolution["splitDistribution"];
  } | null;
}

export interface EnrichedDisputeDetail extends DisputeDetail {
  escrowOnChainStatus?: string;
  stellarExplorerUrl?: string;
  resolutionTxHash?: string;
}

function buildStellarExplorerUrl(accountId?: string | null): string {
  if (!accountId) return "";
  return `https://stellar.expert/explorer/public/account/${encodeURIComponent(accountId)}`;
}

export function useDisputeDetail(disputeId: string) {
  const query = useApiQuery<DisputeDetailApiResponse>(
    ["dispute-detail", disputeId],
    () => apiClient.get<DisputeDetailApiResponse>(`/disputes/${disputeId}`),
    { enabled: Boolean(disputeId) },
  );

  const enrichedData = useMemo<EnrichedDisputeDetail | undefined>(() => {
    if (!query.data) {
      return undefined;
    }

    const raw = query.data;

    // Map API resolution shape to our typed DisputeResolution
    let resolution: DisputeResolution | null = null;
    if (
      raw.resolution &&
      raw.resolution.type &&
      (raw.resolution.type === "REFUND" ||
        raw.resolution.type === "RELEASE" ||
        raw.resolution.type === "SPLIT")
    ) {
      resolution = {
        type: raw.resolution.type,
        adminNote: raw.resolution.adminNote ?? "",
        resolvedBy: raw.resolution.resolvedBy ?? "",
        resolvedAt: raw.resolution.resolvedAt ?? "",
        resolutionTxHash: raw.resolution.txHash,
        splitDistribution: raw.resolution.splitDistribution,
      };
    }

    return {
      ...raw,
      resolution,
      escrowOnChainStatus: raw.escrow?.status,
      stellarExplorerUrl: buildStellarExplorerUrl(raw.escrow?.accountId),
      resolutionTxHash: raw.resolution?.txHash,
    };
  }, [query.data]);

  return {
    ...query,
    data: enrichedData,
  };
}
