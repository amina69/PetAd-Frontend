import { redact, scrubArgs } from "./scrub";

/**
 * Structured central client logger with levels, namespaces, and localStorage flag gating.
 *
 * Requirements (Issue #785 / #179):
 * - Levels: `debug`, `info`, `warn`, `error`
 * - Namespaces: `api`, `realtime`, `auth` (and arbitrary namespaces via `forNamespace`)
 * - `debug` enabled via `localStorage` flag in dev/staging only
 * - Production keeps `warn`/`error` (PII scrubbed) while `debug`/`info` are no-ops
 * - Redaction helper for objects (emails, tokens, phone numbers) covering nested objects and arrays
 */

export type LogLevel = "debug" | "info" | "warn" | "error";
export type KnownNamespace = "api" | "realtime" | "auth";

// Read at call time so tests can toggle it via `vi.stubEnv`.
export const isProd = (): boolean => Boolean(import.meta.env.PROD);

/**
 * Checks whether debug logging is enabled for the given namespace or globally.
 * Debug is strictly disabled in production builds. In dev/staging, it is enabled
 * via the `localStorage` flag ("debug", "petad:debug", or "petad_debug").
 */
export function isDebugEnabled(namespace?: string): boolean {
  if (isProd()) return false;
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const flag =
      window.localStorage.getItem("debug") ??
      window.localStorage.getItem("petad:debug") ??
      window.localStorage.getItem("petad_debug");

    if (!flag) return false;
    const trimmed = flag.trim();
    if (trimmed === "true" || trimmed === "1" || trimmed === "*") return true;
    if (!namespace) return false;

    // Supports comma-separated namespaces or wildcards (e.g. "api,realtime", "api:*", "auth")
    const patterns = trimmed.split(/[\s,]+/).filter(Boolean);
    return patterns.some((pattern) => {
      if (pattern === "*" || pattern === "true" || pattern === "1") return true;
      if (pattern.endsWith("*")) {
        const prefix = pattern.slice(0, -1);
        return namespace.startsWith(prefix);
      }
      return pattern === namespace;
    });
  } catch {
    return false;
  }
}

/**
 * Helper to enable or disable debug logging via localStorage (in dev/staging).
 */
export function setDebugFlag(flag: string | boolean | null): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    if (flag === null || flag === false) {
      window.localStorage.removeItem("debug");
    } else if (flag === true) {
      window.localStorage.setItem("debug", "true");
    } else {
      window.localStorage.setItem("debug", flag);
    }
  } catch {
    // Ignore when localStorage is inaccessible
  }
}

export interface LoggerInstance {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

export function createLogger(namespace?: string): LoggerInstance {
  const prefix = namespace ? `[${namespace}]` : null;

  return {
    debug(...args: unknown[]): void {
      if (!isDebugEnabled(namespace)) return;
      if (prefix) {
        console.debug(prefix, ...scrubArgs(args));
      } else {
        console.debug(...scrubArgs(args));
      }
    },
    info(...args: unknown[]): void {
      if (isProd()) return;
      if (prefix) {
        console.info(prefix, ...scrubArgs(args));
      } else {
        console.info(...scrubArgs(args));
      }
    },
    warn(...args: unknown[]): void {
      if (prefix) {
        console.warn(prefix, ...scrubArgs(args));
      } else {
        console.warn(...scrubArgs(args));
      }
    },
    error(...args: unknown[]): void {
      if (prefix) {
        console.error(prefix, ...scrubArgs(args));
      } else {
        console.error(...scrubArgs(args));
      }
    },
  };
}

const rootLogger = createLogger();

export const logger = {
  debug: rootLogger.debug,
  info: rootLogger.info,
  warn: rootLogger.warn,
  error: rootLogger.error,
  api: createLogger("api"),
  realtime: createLogger("realtime"),
  auth: createLogger("auth"),
  forNamespace(namespace: string): LoggerInstance {
    return createLogger(namespace);
  },
  redact,
};

export { redact } from "./scrub";
export type Logger = typeof logger;
