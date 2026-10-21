export interface PetFixture {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: string;
  status: string;
  interests: number;
  imageUrl: string;
  isPublic: boolean;
}

export function buildPet(overrides: Partial<PetFixture> = {}): PetFixture {
  return {
    id: 1,
    name: "Pet For Adoption",
    species: "Dog",
    breed: "German Shepherd",
    age: "4yrs old",
    status: "Available",
    interests: 4,
    imageUrl: "/assets/dog.png",
    isPublic: true,
    ...overrides,
  };
}
