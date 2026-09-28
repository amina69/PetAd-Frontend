import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// Browser MSW worker — started in main.tsx when VITE_MSW=true.
//
// Import contract: this module must never be part of the static production
// entry graph. It is only allowed to be pulled in by the guarded dynamic import
// in src/main.tsx (DEV + VITE_MSW=true) or by test setup (src/mocks/server.ts →
// src/test/setup.ts). Static imports of it would defeat tree-shaking and leak
// setupWorker plus every handler into the production bundle.
export const worker = setupWorker(...handlers);

