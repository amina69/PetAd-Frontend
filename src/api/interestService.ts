
import type { InterestPet } from '../types';
import dogImg from "../assets/dog.png";
import parrotImg from "../assets/parrot.png";
import catImg from "../assets/cat.png";

// Mock data
const MOCK_INTERESTS: InterestPet[] = [
  {
    id: "1",
    name: "Pet For Adoption",
    breed: "Dog, German Shepard",
    category: "dog",
    age: "4yrs old",
    location: "Mainland, Lagos Nigeria",
    imageUrl: dogImg,
    isFavourite: false,
    isInterested: true,
    consent: "awaiting",
    adoption: false,
  },
  {
    id: "2",
    name: "Pet For Adoption",
    breed: "Parrot",
    category: "bird",
    age: "4yrs old",
    location: "Mainland, Lagos Nigeria",
    imageUrl: parrotImg,
    isFavourite: false,
    isInterested: true,
    consent: "granted",
    adoption: false,
  },
  {
    id: "3",
    name: "Pet For Adoption",
    breed: "Cat, Persian",
    category: "cat",
    age: "4yrs old",
    location: "Mainland, Lagos Nigeria",
    imageUrl: catImg,
    isFavourite: false,
    isInterested: true,
    consent: "granted",
    adoption: true,
  },
];

export const interestService = {
  getInterests: async (): Promise<InterestPet[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...MOCK_INTERESTS]); // Return a copy to avoid mutation issues with mock data
      }, 800);
    });
  },

  // Simulate server-side removal
  removeInterest: async (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Removed interest for pet ${id}`);
        resolve(true);
      }, 500);
    });
  },

  // Simulate starting adoption
  startAdoption: async (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Started adoption for pet ${id}`);
        resolve(true);
      }, 500);
    });
  }
};
