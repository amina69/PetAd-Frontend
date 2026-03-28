import { http, HttpResponse, delay } from "msw";
import type { CustodyDetails } from "../../types/adoption";

const MOCK_CUSTODY_DETAILS: CustodyDetails = {
  id: "custody-1",
  status: "CUSTODY_ACTIVE",
  petId: "pet-1",
  custodianId: "user-1",
  ownerId: "user-2",
  startDate: "2026-03-25T10:00:00Z",
  createdAt: "2026-03-25T10:00:00Z",
  updatedAt: "2026-03-25T10:10:00Z",
};

export const custodyHandlers = [
  http.get("/api/custody/:id", async ({ params }) => {
    await delay(100);
    const { id } = params;
    
    if (id === "custody-1") {
      return HttpResponse.json(MOCK_CUSTODY_DETAILS);
    }
    
    return HttpResponse.json(
      { error: "Custody not found" },
      { status: 404 }
    );
  }),
];
