import { http, HttpResponse, delay } from "msw";

// ─── Types ────────────────────────────────────────────────────────────────────
// Matches Prisma `Document` model exactly and the response shape from
// DocumentsService.uploadDocuments().

interface Document {
	id: string;
	fileName: string;
	fileUrl: string;
	publicId: string;
	mimeType: string;
	size: number;
	uploadedById: string;
	adoptionId: string;
	createdAt: string;
	updatedAt: string;
	onChainVerified: boolean | null;
	anchorTxHash: string | null;
	reviewStatus: "PENDING" | "APPROVED" | "REJECTED";
	reviewReason: string | null;
}

interface ReviewDocumentPayload {
	decision: "APPROVED" | "REJECTED";
	reason?: string;
}

interface UploadDocumentsResponse {
	message: string;
	documents: Document[];
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const MOCK_DOCUMENTS: Document[] = [
	{
		id: "doc-001",
		fileName: "vaccination-certificate-2026.pdf",
		fileUrl: "https://res.cloudinary.com/petad/image/upload/v1/adoptions/adoption-001/vaccination-cert.pdf",
		publicId: "adoptions/adoption-001/vaccination-certificate-2026",
		mimeType: "application/pdf",
		size: 102400,
		uploadedById: "user-owner-1",
		adoptionId: "adoption-001",
		createdAt: "2026-03-18T08:00:00.000Z",
		updatedAt: "2026-03-18T08:00:00.000Z",
		onChainVerified: true,
		anchorTxHash: "4f5f8abf20f6cb9d88a4dd5a13f5e97a9f5a7f72f0f7d9f8cf5a6a4d91aa1142",
		reviewStatus: "PENDING",
		reviewReason: null,
	},
	{
		id: "doc-002",
		fileName: "vet-health-report.pdf",
		fileUrl: "https://res.cloudinary.com/petad/image/upload/v1/adoptions/adoption-001/vet-health-report.pdf",
		publicId: "adoptions/adoption-001/vet-health-report",
		mimeType: "application/pdf",
		size: 204800,
		uploadedById: "user-owner-1",
		adoptionId: "adoption-001",
		createdAt: "2026-03-18T08:30:00.000Z",
		updatedAt: "2026-03-18T08:30:00.000Z",
		onChainVerified: null,
		anchorTxHash: null,
		reviewStatus: "PENDING",
		reviewReason: null,
	},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDelay(request: Request): number {
	return Number(new URL(request.url).searchParams.get("delay") ?? 0);
}

// ─── Handlers ─────────────────────────────────────────────────────────────────
// Route: POST /adoption/:id/documents (FilesInterceptor, multipart/form-data).
// Response matches DocumentsService.uploadDocuments() return shape exactly.

export const filesHandlers = [
	// POST /adoption/:id/documents — upload one or more documents
	// The real endpoint accepts multipart/form-data with a "files" field.
	// In tests and dev we accept the request and return a shaped mock response.
	http.post("/api/adoption/:id/documents", async ({ request, params }) => {
		await delay(getDelay(request));

		// Simulate uploading 1 new document
		const now = new Date().toISOString();
		const newDoc: Document = {
			id: `doc-${Date.now()}`,
			fileName: "uploaded-document.pdf",
			fileUrl: `https://res.cloudinary.com/petad/image/upload/v1/adoptions/${params.id}/uploaded-document.pdf`,
			publicId: `adoptions/${params.id}/uploaded-document`,
			mimeType: "application/pdf",
			size: 51200,
			uploadedById: "current-user",
			adoptionId: params.id as string,
			createdAt: now,
			updatedAt: now,
			onChainVerified: null,
			anchorTxHash: null,
			reviewStatus: "PENDING",
			reviewReason: null,
		};

		return HttpResponse.json<UploadDocumentsResponse>({
			message: "Documents uploaded successfully",
			documents: [newDoc],
		}, { status: 201 });
	}),

	// GET /api/adoption/:id/documents — list documents for an adoption (Phase 2 read endpoint)
	http.get("/api/adoption/:id/documents", async ({ request, params }) => {
		await delay(getDelay(request));
		const docs = MOCK_DOCUMENTS.filter(
			(d) => d.adoptionId === params.id || params.id === "adoption-001",
		);
		return HttpResponse.json<Document[]>(docs);
	}),

	// PATCH /api/documents/:id/review — review a single document (admin)
	http.patch("/api/documents/:id/review", async ({ request, params }) => {
		await delay(getDelay(request));

		const body = (await request.json()) as ReviewDocumentPayload;
		const document = MOCK_DOCUMENTS.find((doc) => doc.id === params.id);

		if (!document) {
			return HttpResponse.json(
				{ message: "Document not found" },
				{ status: 404 },
			);
		}

		document.reviewStatus = body.decision;
		document.reviewReason = body.decision === "REJECTED" ? (body.reason ?? "") : null;
		document.updatedAt = new Date().toISOString();

		return HttpResponse.json<Document>(document);
	}),
];
