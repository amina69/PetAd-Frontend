import { z } from "zod";

/**
 * Runtime validation of `import.meta.env`, executed once at app boot
 * (imported first in src/main.tsx).
 *
 * Fails loudly with a named error listing exactly which variable is
 * missing or malformed — instead of letting `undefined` values flow
 * silently into the app and crash deep inside a component.
 */

/**
 * Shape of the validated Vite environment.
 */
const envSchema = z.object({
  /** Base URL of the PetAd backend API (e.g. "/api" when using MSW). */
  VITE_API_URL: z
    .string({
      // Custom message so an *absent* var says "missing" instead of Zod's
      // generic "expected string, received undefined".
      error: "is missing — add it to your .env file (see .env.example)",
    })
    .trim()
    .min(1, "is missing — add it to your .env file (see .env.example)")
    .refine(
      (value) => value.startsWith("/") || /^https?:\/\//.test(value),
      "must be an absolute http(s) URL or a root-relative path starting with '/'",
    ),
  /** Enables the mock service worker in dev. Optional; defaults to "false". */
  VITE_MSW: z.enum(["true", "false"]).default("false"),
  /** Stellar network used for explorer links. Optional; defaults to "testnet". */
  VITE_STELLAR_NETWORK: z.enum(["testnet", "mainnet"]).default("testnet"),
});

export type Env = z.infer<typeof envSchema>;

export class EnvValidationError extends Error {
  constructor(issues: string[]) {
    super(
      [
        "Invalid environment configuration. Fix the following variables:",
        ...issues.map((issue) => `  ✗ ${issue}`),
        "",
        "Variables are read from .env / .env.local — copy .env.example to get started.",
      ].join("\n"),
    );
    this.name = "EnvValidationError";
  }
}

/**
 * Validates a raw environment object and returns typed, validated values.
 * Throws {@link EnvValidationError} naming every invalid/missing variable.
 */
export function validateEnv(
  raw: Record<string, unknown> = import.meta.env,
): Env {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `${issue.path.join(".") || "(unknown)"} ${issue.message}`,
    );

    // Surface a clear, named error in the console even when this throws
    // during module evaluation (the thrown error alone can be terse).
    console.error(`\n[${EnvValidationError.name}]\n${issues.join("\n")}\n`);

    throw new EnvValidationError(issues);
  }

  return result.data;
}

/**
 * Validated environment for the running app. Importing this module
 * triggers validation; a failure aborts the app at startup with a
 * clear, named console error instead of a crash deep in a component.
 */
export const env = validateEnv();
