import { http, HttpResponse, delay } from "msw";
import type { ShelterApprovalsResponse, ShelterApprovalQueueItem } from "../../types/shelter";

const MOCK_SHELTER_APPROVALS: ShelterApprovalQueueItem[] = [
  {
    id: "adoption-001",
    petId: "pet-001",
    petName: "Buddy",
    petPhotoUrl: "https://images.dog.ceo/breeds/retriever-golden/n02099601_3004.jpg",
    adopterName: "John Doe",
    submissionDate: "2026-03-20T10:00:00Z",
    status: "PENDING",
  },
  {
    id: "adoption-002",
    petId: "pet-002",
    petName: "Luna",
    adopterName: "Jane Smith",
    submissionDate: "2026-03-21T14:30:00Z",
    status: "PENDING",
  },
  {
    id: "adoption-003",
    petId: "pet-003",
    petName: "Max",
    petPhotoUrl: "https://images.dog.ceo/breeds/germanshepherd/n02106662_16149.jpg",
    adopterName: "Alice Johnson",
    submissionDate: "2026-03-22T09:00:00Z",
    status: "PENDING",
  },
  {
      id: "adoption-004",
      petId: "pet-004",
      petName: "Rex",
      adopterName: "Bob Brown",
      submissionDate: "2026-03-24T11:00:00Z",
      status: "PENDING",
  },
  {
      id: "adoption-005",
      petId: "pet-005",
      petName: "Bella",
      adopterName: "Charlie Green",
      submissionDate: "2026-03-25T15:00:00Z",
      status: "PENDING",
  }
];

export const shelterHandlers = [
  http.get("/api/shelter/approvals", async ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    await delay(300);

    let filtered = MOCK_SHELTER_APPROVALS;
    if (status) {
      filtered = MOCK_SHELTER_APPROVALS.filter(item => item.status === status);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const items = filtered.slice(startIndex, endIndex);

    return HttpResponse.json<ShelterApprovalsResponse>({
      items,
      total: filtered.length,
      page,
      hasMore: endIndex < filtered.length,
    });
  }),
];
