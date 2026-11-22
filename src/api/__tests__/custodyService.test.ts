import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { ZodError } from "zod";
import { server } from "../../mocks/server";
import { ForbiddenError, ApiError } from "../../lib/api-errors";
import { CustodyConflictError, custodyService } from "../custodyService";
import type { CustodyArrangement } from "../../features/custody/types";

const arrangement: CustodyArrangement = {
  id: "custody-42",
  petId: "pet-1",
  ownerId: "user-1",
  caretakerId: "user-2",
  startDate: "2026-06-20",
  endDate: "2026-06-27",
  status: "requested",
  notes: null,
  escrowStatus: null,
};

const request = {
  petId: "pet-1",
  caretakerId: "user-2",
  startDate: "2026-06-20",
  endDate: "2026-06-27",
};

describe("custodyService", () => {
  beforeEach(() => {
    // Only fake Date — MSW relies on real timers.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 5, 15, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getCustodyList", () => {
    it("builds the query string and parses the envelope", async () => {
      let receivedUrl: URL | null = null;
      server.use(
        http.get("*/api/custody", ({ request }) => {
          receivedUrl = new URL(request.url);
          return HttpResponse.json({ data: [arrangement], total: 1, page: 2, limit: 5 });
        }),
      );

      const result = await custodyService.getCustodyList({
        status: "active",
        petId: "pet-1",
        page: 2,
        limit: 5,
      });

      expect(result).toEqual({ data: [arrangement], total: 1, page: 2, limit: 5 });
      expect(receivedUrl!.searchParams.toString()).toBe(
        "status=active&petId=pet-1&page=2&limit=5",
      );
    });

    it("omits the query string when no params are supplied", async () => {
      let search: string | null = null;
      server.use(
        http.get("*/api/custody", ({ request }) => {
          search = new URL(request.url).search;
          return HttpResponse.json({ data: [], total: 0, page: 1, limit: 20 });
        }),
      );

      await custodyService.getCustodyList();
      expect(search).toBe("");
    });

    it("rejects a response that does not match the schema", async () => {
      server.use(
        http.get("*/api/custody", () =>
          HttpResponse.json({ data: [{ ...arrangement, status: "ACTIVE" }], total: 1, page: 1, limit: 20 }),
        ),
      );

      await expect(custodyService.getCustodyList()).rejects.toBeInstanceOf(ZodError);
    });
  });

  describe("getCustodyById", () => {
    it("fetches and parses a single arrangement", async () => {
      server.use(
        http.get("*/api/custody/:id", ({ params }) =>
          HttpResponse.json({ ...arrangement, id: params.id }),
        ),
      );

      await expect(custodyService.getCustodyById("custody-42")).resolves.toEqual(arrangement);
    });

    it("maps 403 to ForbiddenError", async () => {
      server.use(
        http.get("*/api/custody/:id", () =>
          HttpResponse.json({ message: "Not your custody" }, { status: 403 }),
        ),
      );

      const error = await custodyService.getCustodyById("custody-42").catch((e) => e);
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error).not.toBeInstanceOf(CustodyConflictError);
      expect(error.status).toBe(403);
      expect(error.code).toBe("CUSTODY_FORBIDDEN");
      expect(error.message).toBe("Not your custody");
    });

    it("passes other API errors through unchanged", async () => {
      server.use(
        http.get("*/api/custody/:id", () => HttpResponse.json({}, { status: 500 })),
      );

      const error = await custodyService.getCustodyById("custody-42").catch((e) => e);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).not.toBeInstanceOf(ForbiddenError);
      expect(error).not.toBeInstanceOf(CustodyConflictError);
      expect(error.status).toBe(500);
    });
  });

  describe("requestCustody", () => {
    it("posts the validated payload and parses the created arrangement", async () => {
      let body: unknown;
      server.use(
        http.post("*/api/custody", async ({ request: req }) => {
          body = await req.json();
          return HttpResponse.json(arrangement, { status: 201 });
        }),
      );

      await expect(custodyService.requestCustody(request)).resolves.toEqual(arrangement);
      expect(body).toEqual(request);
    });

    it("maps 409 (date conflict) to CustodyConflictError", async () => {
      server.use(
        http.post("*/api/custody", () =>
          HttpResponse.json(
            { message: "Dates overlap an existing custody", code: "DATE_OVERLAP" },
            { status: 409 },
          ),
        ),
      );

      const error = await custodyService.requestCustody(request).catch((e) => e);
      expect(error).toBeInstanceOf(CustodyConflictError);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).not.toBeInstanceOf(ForbiddenError);
      expect(error.status).toBe(409);
      expect(error.code).toBe("DATE_OVERLAP");
      expect(error.message).toBe("Dates overlap an existing custody");
    });

    it("defaults the conflict code when the server does not send one", async () => {
      server.use(http.post("*/api/custody", () => HttpResponse.json({}, { status: 409 })));

      const error = await custodyService.requestCustody(request).catch((e) => e);
      expect(error).toBeInstanceOf(CustodyConflictError);
      expect(error.code).toBe("CUSTODY_DATE_CONFLICT");
    });

    it("rejects an invalid payload without calling the API", async () => {
      const handler = vi.fn(() => HttpResponse.json(arrangement));
      server.use(http.post("*/api/custody", handler));

      await expect(
        custodyService.requestCustody({ ...request, endDate: "2026-06-19" }),
      ).rejects.toBeInstanceOf(ZodError);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("extendCustody", () => {
    it("patches the new end date", async () => {
      let body: unknown;
      let id: unknown;
      server.use(
        http.patch("*/api/custody/:id/extend", async ({ request: req, params }) => {
          body = await req.json();
          id = params.id;
          return HttpResponse.json({ ...arrangement, endDate: "2026-07-04", status: "active" });
        }),
      );

      const result = await custodyService.extendCustody("custody-42", "2026-07-04");
      expect(id).toBe("custody-42");
      expect(body).toEqual({ endDate: "2026-07-04" });
      expect(result.endDate).toBe("2026-07-04");
    });

    it("maps 409 to CustodyConflictError", async () => {
      server.use(
        http.patch("*/api/custody/:id/extend", () =>
          HttpResponse.json({ message: "Conflicts with next booking" }, { status: 409 }),
        ),
      );

      await expect(
        custodyService.extendCustody("custody-42", "2026-07-04"),
      ).rejects.toBeInstanceOf(CustodyConflictError);
    });
  });

  describe("endCustody", () => {
    it("posts to the end endpoint and parses the result", async () => {
      let id: unknown;
      server.use(
        http.post("*/api/custody/:id/end", ({ params }) => {
          id = params.id;
          return HttpResponse.json({ ...arrangement, status: "completed" });
        }),
      );

      const result = await custodyService.endCustody("custody-42");
      expect(id).toBe("custody-42");
      expect(result.status).toBe("completed");
    });

    it("maps 403 to ForbiddenError", async () => {
      server.use(
        http.post("*/api/custody/:id/end", () => HttpResponse.json({}, { status: 403 })),
      );

      await expect(custodyService.endCustody("custody-42")).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    });
  });
});
