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
	status?: "PENDING" | "APPROVED" | "REJECTED" | "IN_REVIEW";
	type?: string;
	applicationInReview?: boolean;
	onChainVerified?: boolean | null;
	anchorTxHash?: string | null;
	expiresAt?: string | null;
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
	},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDelay(request: Request): number {
	return Number(new URL(request.url).searchParams.get("delay") ?? 0);
}

// ─── Handlers ─────────────────────────────────────────────────────────────────
// Route: POST /adoption/:id/documents (FilesInterceptor, multipart/form-data).
// Response matches DocumentsService.uploadDocuments() return shape exactly.

const profileDocuments: Document[] = [
	{
		id: "doc-profile-1",
		fileName: "identity.pdf",
		fileUrl: "https://res.cloudinary.com/petad/image/upload/v1/documents/identity.pdf",
		publicId: "documents/identity",
		mimeType: "application/pdf",
		size: 12000,
		uploadedById: "current-user",
		adoptionId: "adoption-001",
		createdAt: "2026-04-01T08:00:00.000Z",
		updatedAt: "2026-04-01T08:00:00.000Z",
		status: "APPROVED",
		type: "ID",
		onChainVerified: true,
		anchorTxHash: null,
		expiresAt: null,
	},
	{
		id: "doc-in-review",
		fileName: "application-packet.pdf",
		fileUrl: "https://res.cloudinary.com/petad/image/upload/v1/documents/application-packet.pdf",
		publicId: "documents/application-packet",
		mimeType: "application/pdf",
		size: 22000,
		uploadedById: "current-user",
		adoptionId: "adoption-002",
		createdAt: "2026-04-02T08:00:00.000Z",
		updatedAt: "2026-04-02T08:00:00.000Z",
		status: "IN_REVIEW",
		type: "Adoption form",
		applicationInReview: true,
		onChainVerified: null,
		anchorTxHash: null,
		expiresAt: null,
	},
];

export const filesHandlers = [
	http.get("/api/documents", async ({ request }) => {
		await delay(getDelay(request));
		return HttpResponse.json(profileDocuments);
	}),

	http.post("/api/documents", async ({ request }) => {
		await delay(getDelay(request));
		const form = await request.formData();
		const uploaded = form.get("file");
		const fileName = uploaded instanceof File ? uploaded.name : "uploaded-document.pdf";
		const now = new Date().toISOString();
		const created: Document = {
			id: `doc-${Date.now()}`,
			fileName,
			fileUrl: `https://res.cloudinary.com/petad/image/upload/v1/documents/${fileName}`,
			publicId: `documents/${fileName}`,
			mimeType: uploaded instanceof File ? uploaded.type || "application/pdf" : "application/pdf",
			size: uploaded instanceof File ? uploaded.size : 1024,
			uploadedById: "current-user",
			adoptionId: "adoption-001",
			createdAt: now,
			updatedAt: now,
			status: "PENDING",
			type: String(form.get("type") ?? "Other"),
			onChainVerified: null,
			anchorTxHash: null,
			expiresAt: null,
		};
		profileDocuments.unshift(created);
		return HttpResponse.json(created, { status: 201 });
	}),

	http.delete("/api/documents/:id", async ({ params }) => {
		const index = profileDocuments.findIndex((doc) => doc.id === params.id);
		if (index === -1) {
			return HttpResponse.json({ message: "Document not found" }, { status: 404 });
		}
		const existing = profileDocuments[index];
		if (existing.applicationInReview) {
			return HttpResponse.json(
				{
					message:
						"This document is attached to an application that is in review and cannot be deleted.",
				},
				{ status: 409 },
			);
		}
		profileDocuments.splice(index, 1);
		return new HttpResponse(null, { status: 204 });
	}),

	http.post("/api/documents/:id/replace", async ({ request, params }) => {
		await delay(getDelay(request));
		const index = profileDocuments.findIndex((doc) => doc.id === params.id);
		if (index === -1) {
			return HttpResponse.json({ message: "Document not found" }, { status: 404 });
		}
		const form = await request.formData();
		const uploaded = form.get("file");
		const existing = profileDocuments[index];
		const fileName = uploaded instanceof File ? uploaded.name : existing.fileName;
		const now = new Date().toISOString();
		profileDocuments[index] = {
			...existing,
			fileName,
			fileUrl: `https://res.cloudinary.com/petad/image/upload/v1/documents/${fileName}`,
			publicId: `documents/${fileName}`,
			mimeType: uploaded instanceof File ? uploaded.type || existing.mimeType : existing.mimeType,
			size: uploaded instanceof File ? uploaded.size : existing.size,
			updatedAt: now,
			status: "PENDING",
			type: String(form.get("type") ?? existing.type ?? "Other"),
		};
		return HttpResponse.json(profileDocuments[index]);
	}),

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
];
