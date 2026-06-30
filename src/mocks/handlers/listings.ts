/**
 * listings.ts — MSW handlers for pet listing endpoints.
 *
 * Public GET endpoints:  no Authorization header required.
 * Mutation endpoints:    return 401 when Authorization header is absent.
 */

import { http, HttpResponse } from "msw";

const DEMO_LISTINGS = [
  {
    id: 1,
    name: "Pet For Adoption",
    species: "Dog",
    breed: "German Shepherd",
    age: "4yrs old",
    status: "Available",
    interests: 4,
    imageUrl: "/assets/dog.png",
    isPublic: true,
  },
  {
    id: 2,
    name: "Pet For Adoption",
    species: "Dog",
    breed: "German Shepherd",
    age: "4yrs old",
    status: "Pending Consent",
    interests: 2,
    imageUrl: "/assets/dog_1.png",
    isPublic: true,
  },
  {
    id: 3,
    name: "Pet For Adoption",
    species: "Dog",
    breed: "Golden Retriever",
    age: "3yrs old",
    status: "Available",
    interests: 1,
    imageUrl: "/assets/golden_retriever.png",
    isPublic: true,
  },
];

/** Returns true when the request carries a valid Bearer token. */
function isAuthorized(request: Request): boolean {
  const auth = request.headers.get("Authorization") ?? "";
  return auth.startsWith("Bearer ") && auth.length > 7;
}

export const listingsHandlers = [
  // ── PUBLIC: list all pet listings (no auth required) ─────────────────────
  http.get("/api/listings", () => {
    return HttpResponse.json({ data: DEMO_LISTINGS });
  }),

  // ── PUBLIC: get a single pet listing (no auth required) ──────────────────
  http.get("/api/listings/:id", ({ params }) => {
    const listing = DEMO_LISTINGS.find((l) => l.id === Number(params.id));
    if (!listing) {
      return HttpResponse.json({ message: "Listing not found" }, { status: 404 });
    }
    return HttpResponse.json({ data: listing });
  }),

  // ── PROTECTED: express interest (auth required) ───────────────────────────
  http.post("/api/listings/:id/interest", ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json(
        { message: "Authentication required to express interest.", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    return HttpResponse.json({ success: true });
  }),

  // ── PROTECTED: add to favourites (auth required) ─────────────────────────
  http.post("/api/listings/:id/favourite", ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json(
        { message: "Authentication required to save favourites.", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    return HttpResponse.json({ success: true });
  }),

  // ── PROTECTED: create a new listing (auth required) ──────────────────────
  http.post("/api/listings", ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json(
        { message: "Authentication required to create a listing.", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    return HttpResponse.json({ success: true, id: 99 }, { status: 201 });
  }),

  // ── PROTECTED: update a listing (auth required) ───────────────────────────
  http.put("/api/listings/:id", ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json(
        { message: "Authentication required to update a listing.", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    return HttpResponse.json({ success: true });
  }),

  // ── PROTECTED: delete a listing (auth required) ───────────────────────────
  http.delete("/api/listings/:id", ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json(
        { message: "Authentication required to delete a listing.", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    return HttpResponse.json({ success: true });
  }),
];
