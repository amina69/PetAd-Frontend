import { apiClient } from "../lib/api-client";
import type { CustodyDetails, AdoptionStatus } from "../types/adoption";

export interface CustodyTimelineEvent {
  type: string;
  label: string;
  timestamp: string;
  stellarExplorerUrl?: string;
  fromStatus?: AdoptionStatus;
  toStatus?: AdoptionStatus;
}

export const custodyService = {
  async getDetails(custodyId: string): Promise<CustodyDetails> {
    return apiClient.get<CustodyDetails>(`/custody/${custodyId}`);
  },

  async getTimeline(custodyId: string): Promise<CustodyTimelineEvent[]> {
    return apiClient.get<CustodyTimelineEvent[]>(`/custody/${custodyId}/timeline`);
  },
};
