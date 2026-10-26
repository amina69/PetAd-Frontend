import { apiClient } from "../lib/api-client";

export const petService = {
  getPet: async (id: string): Promise<unknown> => apiClient.get(`/listings/${id}`),
};
