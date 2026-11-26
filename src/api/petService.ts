import { apiClient } from "../lib/api-client";
import type { Pet } from "../types/pet";

export const petService = {
  getPet: async (id: string): Promise<unknown> => apiClient.get(`/listings/${id}`),
  searchPets: async (query: string): Promise<Pet[]> => {
    const search = new URLSearchParams({ search: query });
    const response = await apiClient.get<{ data: Pet[] }>(`/listings?${search.toString()}`);
    return response.data;
  },
};
