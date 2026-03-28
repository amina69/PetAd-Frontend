import { cleanup } from "@testing-library/react";
import { server } from "../mocks/server";
import { beforeAll, afterEach, afterAll } from "vitest";
import "@testing-library/jest-dom";

// ─── MSW ──────────────────────────────────────────────────────────────────────
// Start the server before all tests, reset overrides between tests, and close
// after the suite. Tests that stub `fetch` via `vi.stubGlobal` are unaffected
// because the stub takes precedence over MSW's interceptors.
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── DOM cleanup ──────────────────────────────────────────────────────────────
afterEach(() => {
  cleanup();
});