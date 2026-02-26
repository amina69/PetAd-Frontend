export interface AdoptionRating {
  rating: number;
  feedback: string;
  adoptionId?: string;
  petId?: string;
}

export const adoptionService = {
  async submitRating(ratingData: AdoptionRating): Promise<void> {
    // TODO: Replace with actual API endpoint
    console.log("Submitting rating:", ratingData);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock successful submission
    return Promise.resolve();
  },
};
