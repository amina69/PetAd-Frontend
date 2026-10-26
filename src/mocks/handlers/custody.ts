import { http, HttpResponse, delay } from "msw";
import type { CustodyDetails } from "../../types/adoption";

const MOCK_CUSTODY_DETAILS: Record<string, CustodyDetails> = {
  "custody-1": {
    id: "custody-1",
    status: "ACTIVE",
    petId: "pet-1",
    custodianId: "user-1",
    ownerId: "user-2",
    startDate: "2026-03-25T10:00:00Z",
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: "2026-03-25T10:00:00Z",
    updatedAt: "2026-03-25T10:10:00Z",
  },
  // Referenced by the Caretaker dashboard's arrangement widgets so their
  // "Timeline" drill-down links resolve offline.
  "custody-2": {
    id: "custody-2",
    status: "ACTIVE",
    petId: "pet-2",
    custodianId: "user-1",
    ownerId: "user-4",
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: "2026-06-01T09:00:00Z",
    updatedAt: "2026-06-01T09:05:00Z",
  },
  "custody-3": {
    id: "custody-3",
    status: "EXPIRING_SOON",
    petId: "pet-3",
    custodianId: "user-1",
    ownerId: "user-5",
    startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: "2026-05-20T09:00:00Z",
    updatedAt: "2026-05-20T09:05:00Z",
  },
};

export const custodyHandlers = [
  http.get("*/api/custody/:id", async ({ params }) => {
    await delay(100);
    const id = String(params.id);
    const record = MOCK_CUSTODY_DETAILS[id];

    if (record) {
      return HttpResponse.json(record);
    }
    
    return HttpResponse.json(
      { error: "Custody not found" },
      { status: 404 }
    );
  }),

  http.get("*/api/custody/:id/timeline", async () => {
    await delay(100);
    return HttpResponse.json([
      {
        type: "STATUS_CHANGE",
        label: "Custody Started",
        timestamp: new Date().toISOString(),
        toStatus: "CUSTODY_ACTIVE"
      }
    ]);
  }),
];
