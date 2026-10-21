import { http, HttpResponse, delay } from "msw";
import type { CustodyArrangement, CustodyStatus } from "../../features/custody/types";
import { eachDate } from "../../lib/dateOnly";

/**
 * In-memory store of custody arrangements.
 *
 * The mock is stateful so that `POST /custody`, `PATCH /custody/:id/extend`
 * and `POST /custody/:id/end` are reflected by the list and detail endpoints,
 * exactly like a real backend.
 */
const arrangements: CustodyArrangement[] = [
  {
    id: "custody-1",
    petId: "pet-1",
    ownerId: "user-2",
    caretakerId: "user-1",
    startDate: "2026-03-25",
    endDate: "2026-04-25",
    status: "active",
    notes: null,
    escrowStatus: "FUNDED",
    escrowId: "escrow-001",
    petName: "Buddy",
    ownerName: "Sam Smith",
    caretakerName: "Alex Doe",
  },
  {
    id: "custody-2",
    petId: "pet-2",
    ownerId: "user-1",
    caretakerId: "user-3",
    startDate: "2026-06-01",
    endDate: "2026-06-14",
    status: "requested",
    notes: "Travelling for work",
    escrowStatus: null,
    escrowId: null,
    petName: "Luna",
    ownerName: "Alex Doe",
    caretakerName: "Robin Fox",
  },
  {
    id: "custody-3",
    petId: "pet-3",
    ownerId: "user-1",
    caretakerId: "user-4",
    startDate: "2026-01-05",
    endDate: "2026-01-19",
    status: "completed",
    notes: null,
    escrowStatus: "RELEASED",
    escrowId: "escrow-003",
    petName: "Milo",
    ownerName: "Alex Doe",
    caretakerName: "Jamie Ray",
  },
];

const DEFAULT_PAGE_SIZE = 20;

/**
 * Serialises an arrangement for the API.
 *
 * The legacy `CustodyDetails` shape (used by `custodyService.getDetails` and
 * the custody timeline page) is still served alongside the Temporary Custody
 * shape so both consumers keep working against the same endpoint.
 */
function serialize(arrangement: CustodyArrangement) {
  return {
    ...arrangement,
    // Legacy aliases kept for the older custody timeline screen.
    custodianId: arrangement.caretakerId,
    createdAt: `${arrangement.startDate}T10:00:00.000Z`,
    updatedAt: `${arrangement.startDate}T10:00:00.000Z`,
  };
}

function findArrangement(id: string): CustodyArrangement | undefined {
  return arrangements.find((arrangement) => arrangement.id === id);
}

export const custodyHandlers = [
  // GET /api/custody/availability — the days a pet is already booked for.
  //
  // Registered before the `:id` route so that the literal path wins over the
  // parameterised one.
  http.get("*/api/custody/availability", async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const petId = url.searchParams.get("petId");

    const booked = arrangements.filter(
      (arrangement) =>
        arrangement.petId === petId &&
        arrangement.status !== "cancelled" &&
        arrangement.status !== "completed",
    );

    const unavailableDates = booked.flatMap((arrangement) =>
      eachDate(arrangement.startDate, arrangement.endDate),
    );

    return HttpResponse.json({ unavailableDates: [...new Set(unavailableDates)] });
  }),

  // GET /api/custody — paginated list of custody arrangements.
  http.get("*/api/custody", async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    // The status filter accepts a single status or a comma-separated list.
    const statuses = (url.searchParams.get("status") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean) as CustodyStatus[];
    const petId = url.searchParams.get("petId");
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? DEFAULT_PAGE_SIZE);

    const filtered = arrangements.filter((arrangement) => {
      if (statuses.length > 0 && !statuses.includes(arrangement.status)) {
        return false;
      }
      if (petId && arrangement.petId !== petId) return false;
      return true;
    });

    const start = (page - 1) * limit;

    return HttpResponse.json({
      data: filtered.slice(start, start + limit).map(serialize),
      total: filtered.length,
      page,
      limit,
    });
  }),

  // GET /api/custody/:id — a single custody arrangement.
  http.get("*/api/custody/:id", async ({ params }) => {
    await delay(100);
    const arrangement = findArrangement(String(params.id));

    if (!arrangement) {
      return HttpResponse.json(
        { error: "Custody not found" },
        { status: 404 }
      );
    }

    return HttpResponse.json(serialize(arrangement));
  }),

  // POST /api/custody — request a new custody arrangement.
  http.post("*/api/custody", async ({ request }) => {
    await delay(100);
    const body = (await request.json()) as {
      petId?: string;
      caretakerId?: string;
      startDate?: string;
      endDate?: string;
      notes?: string;
    };

    if (!body.petId || !body.caretakerId || !body.startDate || !body.endDate) {
      return HttpResponse.json(
        { message: "petId, caretakerId, startDate and endDate are required" },
        { status: 400 }
      );
    }

    const created: CustodyArrangement = {
      id: `custody-${arrangements.length + 1}`,
      petId: body.petId,
      ownerId: "user-1",
      caretakerId: body.caretakerId,
      startDate: body.startDate,
      endDate: body.endDate,
      status: "requested",
      notes: body.notes ?? null,
      escrowStatus: null,
      escrowId: null,
    };

    arrangements.push(created);

    return HttpResponse.json(serialize(created), { status: 201 });
  }),

  // PATCH /api/custody/:id/extend — move the end date of an arrangement.
  http.patch("*/api/custody/:id/extend", async ({ params, request }) => {
    await delay(100);
    const arrangement = findArrangement(String(params.id));

    if (!arrangement) {
      return HttpResponse.json(
        { message: "Custody not found" },
        { status: 404 }
      );
    }

    const body = (await request.json()) as { endDate?: string };

    if (!body.endDate) {
      return HttpResponse.json(
        { message: "endDate is required" },
        { status: 400 }
      );
    }

    arrangement.endDate = body.endDate;

    return HttpResponse.json(serialize(arrangement));
  }),

  // POST /api/custody/:id/end — end an arrangement early.
  http.post("*/api/custody/:id/end", async ({ params }) => {
    await delay(100);
    const arrangement = findArrangement(String(params.id));

    if (!arrangement) {
      return HttpResponse.json(
        { message: "Custody not found" },
        { status: 404 }
      );
    }

    arrangement.status = "completed";

    return HttpResponse.json(serialize(arrangement));
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
