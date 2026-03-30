import { http, HttpResponse, delay } from "msw";
import type {
  AdoptionDetails,
} from "../../types/adoption";

const MOCK_TIMELINE: Record<string, unknown>[] = [
  {
    id: "1",
    adoptionId: "adoption-1",
    sdkEvent: "event1",
    message: "Initial adoption request",
    fromStatus: undefined,
    toStatus: "ESCROW_CREATED",
    actor: "System",
    timestamp: "2026-03-25T10:00:00Z",
    reason: "Initial adoption request",
  },
  {
    fromStatus: "ESCROW_CREATED",
    toStatus: "ESCROW_FUNDED",
    actor: "Adopter",
    timestamp: "2026-03-25T11:30:00Z",
    sdkTxHash: "0x1234...5678",
    stellarExplorerUrl: "https://stellar.expert/explorer/public/tx/1234",
  },
  {
    fromStatus: "ESCROW_FUNDED",
    toStatus: "SETTLEMENT_TRIGGERED",
    actor: "System",
    timestamp: "2026-03-26T09:15:00Z",
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

export const adoptionHandlers = [
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

  // POST /api/adoption/:id/complete — trigger settlement completion
  http.post("/api/adoption/:id/complete", async ({ params }) => {
    await delay(100);
    const { id } = params;

    if (id === "fail") {
      return HttpResponse.json({ error: "Failed to complete adoption" }, { status: 500 });
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // GET /api/adoption/:adoptionId/approvals — get adoption approval state
  http.get("/api/adoption/:adoptionId/approvals", async ({ params }) => {
    await delay(200);
    const { adoptionId } = params;

    // Pre-quorum shape (approvals still being gathered)
    if (adoptionId === "adoption-pending") {
      return HttpResponse.json({
        required: 3,
        given: 1,
        pending: 2,
        quorumMet: false,
        escrowAccountId: "escrow-123",
        parties: [
          {
            id: "party-1",
            name: "Dr. Sarah Lee",
            role: "Veterinary Inspector",
            status: "APPROVED",
            timestamp: "2026-03-29T10:00:00Z",
          },
          {
            id: "party-2",
            name: "Mark Evans",
            role: "Welfare Officer",
            status: "PENDING",
          },
          {
            id: "party-3",
            name: "Jane Smith",
            role: "Legal Reviewer",
            status: "PENDING",
          },
        ],
      });
    }

    // Post-quorum shape (all approvals received)
    if (adoptionId === "adoption-approved") {
      return HttpResponse.json({
        required: 3,
        given: 3,
        pending: 0,
        quorumMet: true,
        escrowAccountId: "escrow-456",
        parties: [
          {
            id: "party-1",
            name: "Dr. Sarah Lee",
            role: "Veterinary Inspector",
            status: "APPROVED",
            timestamp: "2026-03-29T10:00:00Z",
          },
          {
            id: "party-2",
            name: "Mark Evans",
            role: "Welfare Officer",
            status: "APPROVED",
            timestamp: "2026-03-29T11:30:00Z",
          },
          {
            id: "party-3",
            name: "Jane Smith",
            role: "Legal Reviewer",
            status: "APPROVED",
            timestamp: "2026-03-29T12:15:00Z",
          },
        ],
      });
    }

    return HttpResponse.json({ error: "Adoption not found" }, { status: 404 });
  }),
];
