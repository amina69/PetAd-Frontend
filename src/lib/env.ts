import { z } from "zod";

const booleanString = z
	.string()
	.optional()
	.superRefine((value, ctx) => {
		if (
			value === undefined ||
			value === "" ||
			value === "true" ||
			value === "false"
		) {
			return;
		}
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: 'must be the string "true" or "false"',
		});
	});

const optionalUrl = z
	.string()
	.optional()
	.superRefine((value, ctx) => {
		if (value === undefined || value === "") return;
		try {
			new URL(value);
		} catch {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "must be a valid URL",
			});
		}
	});

const envSchema = z.object({
	// Optional: the API client falls back to /api under MSW and localhost otherwise.
	// When set it must be an absolute URL or an app-relative path.
	VITE_API_URL: z
		.string()
		.optional()
		.superRefine((value, ctx) => {
			if (value === undefined || value === "" || value.startsWith("/")) return;
			try {
				new URL(value);
			} catch {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "must be a valid URL or an app-relative path",
				});
			}
		}),
	VITE_MSW: booleanString,
	VITE_ENABLE_ANALYTICS: booleanString,
	VITE_APP_NAME: z.string().optional(),
	VITE_STELLAR_NETWORK: z
		.string()
		.optional()
		.superRefine((value, ctx) => {
			if (value === undefined || value === "" || value === "testnet" || value === "mainnet") {
				return;
			}
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'must be "testnet" or "mainnet"',
			});
		}),
	VITE_STELLAR_PUBLIC_KEY: z.string().optional(),
	VITE_REALTIME_URL: optionalUrl,
});

export type AppEnv = z.infer<typeof envSchema>;

function readEnv(source: Record<string, string | boolean | undefined>): AppEnv {
	const parsed = envSchema.safeParse({
		VITE_API_URL: source.VITE_API_URL,
		VITE_MSW: source.VITE_MSW,
		VITE_ENABLE_ANALYTICS: source.VITE_ENABLE_ANALYTICS,
		VITE_APP_NAME: source.VITE_APP_NAME,
		VITE_STELLAR_NETWORK: source.VITE_STELLAR_NETWORK,
		VITE_STELLAR_PUBLIC_KEY: source.VITE_STELLAR_PUBLIC_KEY,
		VITE_REALTIME_URL: source.VITE_REALTIME_URL,
	});

	if (!parsed.success) {
		const details = parsed.error.issues
			.map((issue) => {
				const name = issue.path.join(".") || "environment";
				return `${name}: ${issue.message}`;
			})
			.join("; ");
		throw new Error(`Invalid environment configuration: ${details}`);
	}

	return parsed.data;
}

/** Validate Vite env at boot. Throws a readable error naming each bad variable. */
export function loadEnv(
	source: Record<string, string | boolean | undefined> = import.meta.env,
): AppEnv {
	return readEnv(source);
}
