import { scrubArgs } from "./scrub";

/**
 * Central logger. Use this instead of `console.*` so that:
 *  - `debug`/`info` are no-ops in production builds (nothing leaks to devtools),
 *  - `warn`/`error` are always emitted but scrubbed of PII, tokens and cookies
 *    (see `scrub.ts`),
 *  - tests can silence or spy on one seam.
 *
 * Never pass request bodies, headers or cookies. Log identifiers and
 * outcomes (`adoptionId`, `status`), not payloads.
 */

// Read at call time so tests can toggle it via `vi.stubEnv`.
const isProd = () => import.meta.env.PROD;

export const logger = {
  debug(...args: unknown[]): void {
    if (isProd()) return;
    console.debug(...scrubArgs(args));
  },
  info(...args: unknown[]): void {
    if (isProd()) return;
    console.info(...scrubArgs(args));
  },
  warn(...args: unknown[]): void {
    console.warn(...scrubArgs(args));
  },
  error(...args: unknown[]): void {
    console.error(...scrubArgs(args));
  },
};

export type Logger = typeof logger;
