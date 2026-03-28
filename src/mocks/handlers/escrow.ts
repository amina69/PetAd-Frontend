import { http, HttpResponse, delay } from "msw";

// ─── Types ────────────────────────────────────────────────────────────────────
// Matches Prisma `Escrow` model exactly — camelCase as returned by Prisma/NestJS.

type EscrowStatus = "CREATED" | "FUNDED" | "RELEASED" | "REFUNDED" | "DISPUTED";

interface Escrow {
	id: string;
	stellarPublicKey: string;
	stellarSecretEncrypted: string;
	assetCode: string;
	assetIssuer: string | null;
	amount: number;
	fundingTxHash: string | null;
	releaseTxHash: string | null;
	refundTxHash: string | null;
	requiredSignatures: number;
	status: EscrowStatus;
	createdAt: string;
	updatedAt: string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const BASE_ESCROW: Escrow = {
	id: "escrow-001",
	stellarPublicKey: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
	stellarSecretEncrypted: "ENCRYPTED_SECRET_PLACEHOLDER",
	assetCode: "XLM",
	assetIssuer: null,
	amount: 25000,
	fundingTxHash: "abc123fundtxhash",
	releaseTxHash: null,
	refundTxHash: null,
	requiredSignatures: 2,
	status: "FUNDED",
	createdAt: "2026-03-20T10:00:00.000Z",
	updatedAt: "2026-03-20T12:00:00.000Z",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDelay(request: Request): number {
	return Number(new URL(request.url).searchParams.get("delay") ?? 0);
}

// ─── Handlers ─────────────────────────────────────────────────────────────────
// Note: GET /escrow is not in the current backend — escrow is embedded in the adoption response.

export const escrowHandlers = [
	// POST /escrow — createEscrow (called internally; exposed for Phase 2 testing)
	http.post("/api/escrow", async ({ request }) => {
		await delay(getDelay(request));
		const body = (await request.json()) as { amount?: number };
		const created: Escrow = {
			...BASE_ESCROW,
			id: `escrow-${Date.now()}`,
			stellarPublicKey: `ESCROW_${Date.now()}_mock`,
			stellarSecretEncrypted: `ENCRYPTED_SECRET_${Date.now()}`,
			amount: body.amount ?? BASE_ESCROW.amount,
			status: "CREATED",
			fundingTxHash: null,
			releaseTxHash: null,
			refundTxHash: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		return HttpResponse.json<Escrow>(created, { status: 201 });
	}),

	// PATCH /escrow/:id/release — releaseEscrow → status becomes RELEASED
	http.patch("/api/escrow/:id/release", async ({ request, params }) => {
		await delay(getDelay(request));
		const body = (await request.json().catch(() => ({}))) as { txHash?: string };
		return HttpResponse.json<Escrow>({
			...BASE_ESCROW,
			id: params.id as string,
			status: "RELEASED",
			releaseTxHash: body.txHash ?? "mock_release_tx_hash",
			updatedAt: new Date().toISOString(),
		});
	}),

	// PATCH /escrow/:id/refund — refundEscrow → status becomes REFUNDED
	http.patch("/api/escrow/:id/refund", async ({ request, params }) => {
		await delay(getDelay(request));
		const body = (await request.json().catch(() => ({}))) as { txHash?: string };
		return HttpResponse.json<Escrow>({
			...BASE_ESCROW,
			id: params.id as string,
			status: "REFUNDED",
			refundTxHash: body.txHash ?? "mock_refund_tx_hash",
			updatedAt: new Date().toISOString(),
		});
	}),

	// GET /api/escrow/:id/settlement-summary — fetch settlement breakdown
	http.get("/api/escrow/:id/settlement-summary", async ({ request, params }) => {
		await delay(getDelay(request));
		const id = params.id as string;

		if (id === "not-found") {
			return new HttpResponse(null, { status: 404 });
		}

		const summary: any = {
			onChainStatus: "SUCCESS",
			confirmations: 12,
			payments: [
				{
					id: "pay-1",
					amount: 20000,
					asset: "XLM",
					destination: "GD7...X4Y",
					status: "SUCCESS",
				},
				{
					id: "pay-2",
					amount: 5000,
					asset: "XLM",
					destination: "GB2...A7Q",
					status: "SUCCESS",
				},
			],
			stellarExplorerUrl: `https://stellar.expert/explorer/testnet/tx/mock_tx_hash`,
		};

		return HttpResponse.json(summary);
	}),

	// POST /api/escrow/:id/retry-settlement — retry a failed settlement
	http.post("/api/escrow/:id/retry-settlement", async ({ request, params }) => {
		await delay(getDelay(request));
		const id = params.id as string;

		if (id === "fail") {
			return HttpResponse.json({ error: "Retry settlement failed" }, { status: 500 });
		}

		return new HttpResponse(null, { status: 204 });
	}),

	// GET /api/escrow/:id/status — get escrow status (for polling)
	http.get("/api/escrow/:id/status", async ({ request, params }) => {
		await delay(getDelay(request));
		const id = params.id as string;

		if (id === "not-found") {
			return new HttpResponse(null, { status: 404 });
		}

		return HttpResponse.json<Escrow>({
			...BASE_ESCROW,
			id,
			status: "FUNDED",
		});
	}),
];
