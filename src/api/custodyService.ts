import { apiClient } from "../lib/api-client";
import type { CustodyDetails } from "../types/adoption";

export interface CustodyTimelineEvent {
  id: string;
  custodyId: string;
  timestamp: string;
  type: string;
  label: string;
  description?: string;
}

export const custodyService = {
  async getDetails(custodyId: string): Promise<CustodyDetails> {
    return apiClient.get(`/custody/${custodyId}`);
  },

  async getTimeline(custodyId: string): Promise<CustodyTimelineEvent[]> {
    return apiClient.get(`/custody/${custodyId}/timeline`);
  },
};
