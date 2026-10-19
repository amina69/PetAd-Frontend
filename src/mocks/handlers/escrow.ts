import { http, HttpResponse, delay } from "msw";
import type { EscrowRecordStatus } from "../../types/escrow";

// ─── Types ────────────────────────────────────────────────────────────────────
// Matches Prisma `Escrow` model exactly — camelCase as returned by Prisma/NestJS.

type EscrowStatus = EscrowRecordStatus;

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
	signatures: { id: string; signer: string; timestamp: string }[];
	required_approvals: number;
	escrow_account_id: string;
	/** Set when a dispute has been raised against this record. */
	disputeId?: string | null;
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
	signatures: [
		{ id: "sig-1", signer: "Shelter A", timestamp: "2026-03-20T11:00:00Z" }
	],
	required_approvals: 2,
	escrow_account_id: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
	createdAt: "2026-03-20T10:00:00.000Z",
	updatedAt: "2026-03-20T12:00:00.000Z",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDelay(request: Request): number {
	return Number(new URL(request.url).searchParams.get("delay") ?? 0);
}

// ─── Handlers ─────────────────────────────────────────────────────────────────
// Note: GET /escrow (list) is not in the current backend — escrow is embedded in
// the adoption response. GET /escrow/:id is the single-record read used by the
// payment status panel.

export const escrowHandlers = [
	// GET /escrow/:id — the escrow record behind the payment status panel.
	// The payload mirrors the backend record (keys, secrets and transaction
	// hashes included) so the UI layer is exercised against the real shape and
	// can prove it never surfaces any of it.
	http.get("/api/escrow/:id", async ({ request, params }) => {
		await delay(getDelay(request));
		const id = params.id as string;

		if (id === "not-found") {
			return new HttpResponse(null, { status: 404 });
		}

		// A dedicated id so the disputed state (and its dispute link) can be
		// inspected locally without touching the other escrow fixtures.
		const isDisputed = id === "escrow-disputed";

		return HttpResponse.json<Escrow>({
			...BASE_ESCROW,
			id,
			status: isDisputed ? "DISPUTED" : BASE_ESCROW.status,
			disputeId: isDisputed ? "dispute-001" : null,
			updatedAt: new Date().toISOString(),
		});
	}),

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

		interface SettlementSummary {
			onChainStatus: string;
			confirmations: number;
			payments: { id: string; amount: number; asset: string; destination: string; status: string }[];
			stellarExplorerUrl: string;
		}
		const summary: SettlementSummary = {
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
