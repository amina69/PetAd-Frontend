/**
 * PII / secret scrubbing shared by `logger` and `analytics`.
 *
 * Two layers: object keys that are sensitive by name are replaced wholesale,
 * and free-text strings are pattern-scrubbed for emails, phone numbers,
 * JWTs and bearer tokens.
 */

export const REDACTED = "[redacted]";

const SENSITIVE_KEY =
  /pass(word)?|secret|token|authorization|auth|cookie|session|credential|api[-_]?key|private[-_]?key|signature|email|phone|mobile|address|first[-_]?name|last[-_]?name|full[-_]?name|^name$|owner[-_]?name|body|payload|message|comment|reason|description|notes?|file[-_]?name|document[-_]?name|url$/i;

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const JWT = /eyJ[\w-]+\.[\w-]+\.[\w-]+/g;
const BEARER = /\bBearer\s+[\w.~+/=-]+/gi;
const PHONE = /(?<![\w.])\+?\d[\d\s().-]{7,}\d(?![\w.])/g;
// Query-string secrets (?token=…&email=…).
const QUERY_SECRET = /([?&](?:token|key|code|email|auth)=)[^&#\s]+/gi;

const MAX_DEPTH = 5;

export function scrubString(value: string): string {
  return value
    .replace(JWT, REDACTED)
    .replace(BEARER, `Bearer ${REDACTED}`)
    .replace(QUERY_SECRET, `$1${REDACTED}`)
    .replace(EMAIL, REDACTED)
    .replace(PHONE, REDACTED);
}

export function scrubValue(value: unknown, depth = 0): unknown {
  if (typeof value === "string") return scrubString(value);
  if (value === null || typeof value !== "object") return value;
  if (depth >= MAX_DEPTH) return REDACTED;

  if (value instanceof Error) {
    return { name: value.name, message: scrubString(value.message) };
  }
  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item, depth + 1));
  }

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEY.test(key) ? REDACTED : scrubValue(val, depth + 1);
  }
  return out;
}

/** Scrubs a list of console-style arguments. */
export function scrubArgs(args: unknown[]): unknown[] {
  return args.map((arg) => scrubValue(arg));
}
