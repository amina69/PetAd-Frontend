import { http, HttpResponse, delay } from "msw";

const PRE_QUORUM_APPROVALS = {
  required: 3,
  given: [
    {
      id: "dec-1",
      approverName: "Dr. Sarah Lee",
      approverRole: "Veterinary Inspector",
      status: "APPROVED",
      reason: "Health check passed. Vaccinations are up to date.",
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    },
  ],
  pending: 2,
  quorumMet: false,
  escrowAccountId: "escrow-abc123",
};

const POST_QUORUM_APPROVALS = {
  required: 3,
  given: [
    {
      id: "dec-1",
      approverName: "Dr. Sarah Lee",
      approverRole: "Veterinary Inspector",
      status: "APPROVED",
      reason: "Health check passed. Vaccinations are up to date.",
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    },
    {
      id: "dec-2",
      approverName: "Mark Evans",
      approverRole: "Welfare Officer",
      status: "APPROVED",
      reason: "Home visit successful. Environment is safe.",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    },
    {
      id: "dec-3",
      approverName: "Nina Patel",
      approverRole: "Shelter Manager",
      status: "APPROVED",
      reason: "All background checks cleared.",
      timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
      txHash: "0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678",
    },
  ],
  pending: 0,
  quorumMet: true,
  escrowAccountId: "escrow-abc123",
};

export const approvalHandlers = [
  // GET /api/adoption/:adoptionId/approvals
  // Returns post-quorum shape for "adoption-quorum", pre-quorum for all others
  http.get("*/api/adoption/:adoptionId/approvals", async ({ params }) => {
    await delay(100);
    const { adoptionId } = params;
    if (adoptionId === "adoption-quorum") {
      return HttpResponse.json(POST_QUORUM_APPROVALS);
    }
    return HttpResponse.json(PRE_QUORUM_APPROVALS);
  }),

  // GET /api/admin/approvals — admin approval queue
  http.get("*/api/admin/approvals", async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const overdueOnly = url.searchParams.get("overdueOnly") === "true";
    const shelter = url.searchParams.get("shelter");

    let items = [
      {
        id: "adoption-101",
        shelter: "Happy Paws Shelter",
        pet: "Buddy (Golden Retriever)",
        adopter: "John Doe",
        submitted: new Date(Date.now() - 86400000 * 4).toISOString(),
        shelterApproved: true,
        daysWaiting: 4,
        isOverdue: true,
      },
      {
        id: "adoption-102",
        shelter: "Rescue League",
        pet: "Luna (Siamese Cat)",
        adopter: "Jane Smith",
        submitted: new Date(Date.now() - 86400000 * 1).toISOString(),
        shelterApproved: true,
        daysWaiting: 1,
        isOverdue: false,
      },
      {
        id: "adoption-103",
        shelter: "Happy Paws Shelter",
        pet: "Max (German Shepherd)",
        adopter: "Robert Brown",
        submitted: new Date(Date.now() - 86400000 * 5).toISOString(),
        shelterApproved: false,
        daysWaiting: 5,
        isOverdue: true,
      },
      {
        id: "adoption-104",
        shelter: "City Animal Center",
        pet: "Bella (Beagle)",
        adopter: "Emily White",
        submitted: new Date(Date.now() - 3600000 * 12).toISOString(),
        shelterApproved: false,
        daysWaiting: 0,
        isOverdue: false,
      },
    ];

    if (overdueOnly) {
      items = items.filter((item) => item.isOverdue);
    }
    if (shelter && shelter !== "") {
      items = items.filter((item) =>
        item.shelter.toLowerCase().includes(shelter.toLowerCase().replace("-", " "))
      );
    }

    return HttpResponse.json({ items, nextCursor: null });
  }),
];
