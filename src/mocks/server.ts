import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// Node MSW server for Vitest — lifecycle hooks wired in src/test/setup.ts.
// Override per-test: server.use(http.get('/api/...', () => HttpResponse.json({...})))
export const server = setupServer(...handlers);

