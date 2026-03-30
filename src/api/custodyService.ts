import { apiClient } from "../lib/api-client";
import type { CustodyDetails } from "../types/adoption";

export const custodyService = {
  async getDetails(custodyId: string): Promise<CustodyDetails> {
    return apiClient.get(`/custody/${custodyId}`);
  },
};