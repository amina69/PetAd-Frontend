import { http, HttpResponse, delay } from "msw";
import type {
  AdoptionTimelineEntry,
  AdoptionDetails,
  AdoptionRequest,
} from "../../types/adoption";

const MOCK_TIMELINE: AdoptionTimelineEntry[] = [
  {
    id: "timeline-1",
    adoptionId: "adoption-1",
    timestamp: "2026-03-25T10:00:00Z",
    sdkEvent: "ADOPTION_REQUESTED",
    message: "Adoption request created",
    actor: "System",
    fromStatus: null,
    toStatus: "ESCROW_CREATED",
    reason: "Initial adoption request",
  },
  {
    id: "timeline-2",
    adoptionId: "adoption-1",
    timestamp: "2026-03-25T11:30:00Z",
    sdkEvent: "ESCROW_FUNDED",
    message: "Escrow funded successfully",
    actor: "Adopter",
    fromStatus: "ESCROW_CREATED",
    toStatus: "ESCROW_FUNDED",
    sdkTxHash: "0x1234...5678",
  },

  {
    id: "timeline-3",
    adoptionId: "adoption-1",
    timestamp: "2026-03-26T09:15:00Z",
    sdkEvent: "SETTLEMENT_TRIGGERED",
    message: "Settlement triggered",
    actor: "System",
    fromStatus: "ESCROW_FUNDED",
    toStatus: "SETTLEMENT_TRIGGERED",
    reason: "Auto-settlement after inspection",
  },
];

const MOCK_ADOPTION_DETAILS: AdoptionDetails = {
  id: "adoption-1",
  status: "ESCROW_FUNDED",
  petId: "pet-1",
  adopterId: "user-1",
  createdAt: "2026-03-25T10:00:00Z",
  updatedAt: "2026-03-25T10:10:00Z",
};

const MOCK_ADOPTION_REQUESTS: AdoptionRequest[] = [
  {
    id: "adoption-1",
    status: "DISPUTED",
    petId: "pet-1",
    petName: "Buddy",
    petBreed: "Dog, German Shepherd",
    petAge: "4 years old",
    petImageUrl: "https://images.example.com/buddy.jpg",
    adopterId: "user-1",
    adopterName: "Angela Christopher",
    location: "Lekki, Lagos",
    createdAt: "2026-03-20T08:00:00.000Z",
    updatedAt: "2026-03-22T09:30:00.000Z",
  },
  {
    id: "adoption-2",
    status: "DISPUTED",
    petId: "pet-2",
    petName: "Milo",
    petBreed: "Cat, Persian",
    petAge: "2 years old",
    petImageUrl: "https://images.example.com/milo.jpg",
    adopterId: "user-2",
    adopterName: "Tobi Lawson",
    location: "Yaba, Lagos",
    createdAt: "2026-03-18T10:00:00.000Z",
    updatedAt: "2026-03-21T10:30:00.000Z",
  },
  {
    id: "adoption-3",
    status: "DISPUTED",
    petId: "pet-3",
    petName: "Kiwi",
    petBreed: "Parrot, African Grey",
    petAge: "1 year old",
    petImageUrl: "https://images.example.com/kiwi.jpg",
    adopterId: "user-3",
    adopterName: "Samuel Ade",
    location: "Ikeja, Lagos",
    createdAt: "2026-03-15T09:00:00.000Z",
    updatedAt: "2026-03-19T09:45:00.000Z",
  },
  {
    id: "adoption-4",
    status: "ESCROW_FUNDED",
    petId: "pet-4",
    petName: "Luna",
    petBreed: "Dog, Husky",
    petAge: "3 years old",
    petImageUrl: "https://images.example.com/luna.jpg",
    adopterId: "user-4",
    adopterName: "Mercy Bello",
    location: "Abuja",
    createdAt: "2026-03-16T11:00:00.000Z",
    updatedAt: "2026-03-20T07:15:00.000Z",
  },
  {
    id: "adoption-5",
    status: "COMPLETED",
    petId: "pet-5",
    petName: "Coco",
    petBreed: "Dog, Poodle",
    petAge: "5 years old",
    petImageUrl: "https://images.example.com/coco.jpg",
    adopterId: "user-5",
    adopterName: "David Okafor",
    location: "Port Harcourt",
    createdAt: "2026-03-10T09:00:00.000Z",
    updatedAt: "2026-03-14T16:20:00.000Z",
  },
];

export const adoptionHandlers = [
  http.get("/api/adoption/requests", async ({ request }) => {
    await delay(100);
    const statuses = new URL(request.url).searchParams.getAll("status");
    const filteredRequests = statuses.length
      ? MOCK_ADOPTION_REQUESTS.filter((requestItem) => statuses.includes(requestItem.status))
      : MOCK_ADOPTION_REQUESTS;

    return HttpResponse.json(filteredRequests);
  }),
  http.get("/api/adoption/:id/timeline", async () => {
    await delay(100);
    return HttpResponse.json(MOCK_TIMELINE);
  }),
  http.get("/api/adoption/:id", async ({ params }) => {
    await delay(100);
    const { id } = params;

    if (id === "adoption-1") {
      return HttpResponse.json(MOCK_ADOPTION_DETAILS);
    }

    return HttpResponse.json({ error: "Adoption not found" }, { status: 404 });
  }),
];
