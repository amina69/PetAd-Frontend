import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "../mocks/server";

// ─── MSW ──────────────────────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── DOM cleanup ─────────────────────────────────────────────────────
afterEach(() => {
  cleanup();
});;
