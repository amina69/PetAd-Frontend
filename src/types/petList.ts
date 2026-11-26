/** Sort options for the pet listing page (issue #787). */
export type PetSortOption = "newest" | "nearest" | "youngest" | "oldest";

/** Query parameters that describe a filtered + sorted pet list request. */
export interface PetListParams {
  category?: string;
  location?: string;
  sort?: PetSortOption;
}
