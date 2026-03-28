import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "../mocks/server";

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
