import { http, HttpResponse, delay } from "msw";
import type { PetSummary } from "../../types/pet";

/**
 * pets.ts — MSW handlers for the pet catalogue.
 *
 * The catalogue is small and read-only for now, so a static list is enough
 * to back the pet summary header of the custody request flow.
 */
const MOCK_PETS: PetSummary[] = [
  {
    id: "pet-1",
    name: "Buddy",
    species: "Dog",
    breed: "German Shepherd",
    age: "4 yrs old",
    imageUrl: "/assets/dog.png",
  },
  {
    id: "pet-2",
    name: "Luna",
    species: "Dog",
    breed: "Golden Retriever",
    age: "3 yrs old",
    imageUrl: "/assets/golden_retriever.png",
  },
  {
    id: "pet-3",
    name: "Milo",
    species: "Cat",
    breed: "Domestic Shorthair",
    age: "2 yrs old",
    imageUrl: "/assets/cat.png",
  },
];

export const petHandlers = [
  // GET /api/pets/:id — the summary of a single pet.
  http.get("*/api/pets/:id", async ({ params }) => {
    await delay(100);
    const pet = MOCK_PETS.find((candidate) => candidate.id === params.id);

    if (!pet) {
      return HttpResponse.json(
        { message: "Pet not found" },
        { status: 404 },
      );
    }

    return HttpResponse.json(pet);
  }),

  // GET /api/pets — the whole catalogue.
  http.get("*/api/pets", async () => {
    await delay(100);
    return HttpResponse.json({ data: MOCK_PETS });
  }),
];
