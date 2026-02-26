
import type { Listing } from '../types';
import dogImage from '../assets/dog.png';
import dog1Image from '../assets/dog_1.png';
import goldenretrival from "../assets/golden_retriever.png";

// Mock data (replace with API calls later)
const MOCK_LISTINGS: Listing[] = [
  {
    id: 1,
    name: "Pet For Adoption",
    species: "Dog",
    breed: "German Shepard",
    age: "4yrs old",
    status: "Pending Consent",
    interests: 4,
    imageUrl: dogImage
  },
  {
    id: 2,
    name: "Pet For Adoption",
    species: "Dog",
    breed: "German Shepard",
    age: "4yrs old",
    status: "Consent Granted",
    interests: 2,
    imageUrl: dog1Image
  },
  {
    id: 3,
    name: "Pet For Adoption",
    species: "Dog",
    breed: "German Shepard",
    age: "3yrs old",
    status: "Adoption In-progress",
    interests: 1,
    imageUrl: goldenretrival
  }
];

export const listingsService = {
  getListings: async (): Promise<Listing[]> => {
    // Simulate API delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_LISTINGS);
      }, 800);
    });
  },

  getListingById: async (id: number): Promise<Listing | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_LISTINGS.find(l => l.id === id));
      }, 500);
    });
  }
};
