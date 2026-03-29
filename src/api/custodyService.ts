import { apiClient } from "../lib/api-client";
import type { CustodyDetails } from "../types/adoption";

export interface CustodyTimelineEvent {
  type: string;
  label: string;
  timestamp: string;
  stellarExplorerUrl?: string;
}

export const custodyService = {
  async getList(params?: { status?: string[] }): Promise<CustodyDetails[]> {
    const searchParams = new URLSearchParams();
    if (params?.status?.length) {
      searchParams.append('status', params.status.join(','));
    }
    const query = searchParams.toString();
    const url = `/custody${query ? `?${query}` : ''}`;
    return apiClient.get<CustodyDetails[]>(url);
  },

  async getDetails(custodyId: string): Promise<CustodyDetails> {
    return apiClient.get<CustodyDetails>(`/custody/${custodyId}`);
  },

  async getTimeline(custodyId: string): Promise<CustodyTimelineEvent[]> {
    return apiClient.get<CustodyTimelineEvent[]>(`/custody/${custodyId}/timeline`);
  },
};
