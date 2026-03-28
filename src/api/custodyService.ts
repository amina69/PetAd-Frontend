import { apiClient } from "../lib/api-client";
<<<<<<< feat/custody-timeline-page

export interface CustodyTimelineEvent {
  type: string;
  label: string;
  timestamp: string;
  stellarExplorerUrl?: string;
}

export interface CustodyDetails {
  id: string;
  status: string;
  petId: string;
  adopterId: string;
  createdAt: string;
}

export const custodyService = {
  async getDetails(custodyId: string): Promise<CustodyDetails> {
    return apiClient.get<CustodyDetails>(`/custody/${custodyId}`);
  },

  async getTimeline(custodyId: string): Promise<CustodyTimelineEvent[]> {
    return apiClient.get<CustodyTimelineEvent[]>(
      `/custody/${custodyId}/timeline`,
    );
=======
import type { CustodyDetails } from "../types/adoption";

export const custodyService = {
  async getDetails(custodyId: string): Promise<CustodyDetails> {
    return apiClient.get(`/custody/${custodyId}`);
>>>>>>> main
  },
};
