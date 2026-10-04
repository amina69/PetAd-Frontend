/**
 * Browser MSW worker — started only from `src/main.tsx` inside
 * `if (import.meta.env.DEV && import.meta.env.VITE_MSW === 'true')` with a
 * dynamic `import()`.
 *
 * Keep it that way: Rollup statically evaluates that guard and tree-shakes
 * `setupWorker` plus every handler in `./handlers` out of production builds
 * (`grep -r "msw" dist/` must stay empty — issue #525).
 *
 * Never import this module (or `./handlers`) from anything reachable by the
 * production entry graph — including statically. Only `main.tsx` and tests
 * (`src/test/setup.ts` via `server.ts`) may pull in mocks.
 */
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
export const worker = setupWorker(...handlers);

