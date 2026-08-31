import { http, HttpResponse, delay } from "msw";

const BASE_URL = "http://localhost:3000/api";

// ─── Handlers ─────────────────────────────────────────────────────────────────
// NOTE: Real backend contract for approval endpoints pending final confirmation per Epic A.

export const approvalHandlers = [
	// GET /api/adoption/:adoptionId/approvals — list approvals for an adoption
	http.get(`${BASE_URL}/adoption/:adoptionId/approvals`, async () => {
		await delay(800);
		return HttpResponse.json([
			{
				id: "dec-1",
				approverName: "Dr. Sarah Lee",
				approverRole: "Veterinary Inspector",
				status: "APPROVED",
				reason: "Health check passed. Vaccinations are up to date and the pet is in excellent condition.",
				timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
				txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
			},
			{
				id: "dec-2",
				approverName: "Mark Evans",
				approverRole: "Welfare Officer",
				status: "APPROVED",
				reason: "Home visit successful. The environment is safe and suitable for a large dog.",
				timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
				txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678"
			}
		]);
	}),

	// GET /api/shelter/approvals?status=PENDING&limit=0 — pending approval count
	http.get(`${BASE_URL}/shelter/approvals`, async ({ request }: { request: Request }) => {
		await delay(500);
		const url = new URL(request.url);
		const status = url.searchParams.get("status");
		const limit = url.searchParams.get("limit");

		if (status !== "PENDING" || limit !== "0") {
			return HttpResponse.json({ count: 0 });
		}

		return HttpResponse.json({
			count: 12,
		});
	}),

	// GET /api/admin/approvals — admin approval queue
	http.get(`${BASE_URL}/admin/approvals`, async ({ request }: { request: Request }) => {
		await delay(1000);
		const url = new URL(request.url);
		const overdueOnly = url.searchParams.get("overdueOnly") === "true";
		const shelter = url.searchParams.get("shelter");
		const page = Number(url.searchParams.get("page") ?? "1");
		const pageSize = Number(url.searchParams.get("pageSize") ?? "12");
		const safePage = Number.isFinite(page) && page > 0 ? page : 1;
		const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 12;
		
		let items = [
			{
				id: "adoption-101",
				shelter: "Happy Paws Shelter",
				pet: "Buddy (Golden Retriever)",
				adopter: "John Doe",
				submitted: new Date(Date.now() - 86400000 * 4).toISOString(), // 4 days ago
				shelterApproved: true,
				daysWaiting: 4,
				isOverdue: true
			},
			{
				id: "adoption-102",
				shelter: "Rescue League",
				pet: "Luna (Siamese Cat)",
				adopter: "Jane Smith",
				submitted: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
				shelterApproved: true,
				daysWaiting: 1,
				isOverdue: false
			},
			{
				id: "adoption-103",
				shelter: "Happy Paws Shelter",
				pet: "Max (German Shepherd)",
				adopter: "Robert Brown",
				submitted: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
				shelterApproved: false,
				daysWaiting: 5,
				isOverdue: true
			},
			{
				id: "adoption-104",
				shelter: "City Animal Center",
				pet: "Bella (Beagle)",
				adopter: "Emily White",
				submitted: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
				shelterApproved: false,
				daysWaiting: 0,
				isOverdue: false
			}
		];

		if (overdueOnly) {
			items = items.filter(item => item.isOverdue);
		}
		if (shelter && shelter !== "") {
			items = items.filter(item => item.shelter.toLowerCase().includes(shelter.toLowerCase().replace('-', ' ')));
		}

		const startIndex = (safePage - 1) * safePageSize;
		const pagedItems = items.slice(startIndex, startIndex + safePageSize);

		return HttpResponse.json({
			items: pagedItems,
			total: items.length,
			page: safePage,
			pageSize: safePageSize,
			nextCursor: null
		});
	}),

	// GET /api/approvals — list approvals with filtering and pagination
	http.get(`${BASE_URL}/approvals`, async ({ request }: { request: Request }) => {
		const url = new URL(request.url);
		const status = url.searchParams.get("status");
		const page = parseInt(url.searchParams.get("page") || "1", 10);
		const limit = parseInt(url.searchParams.get("limit") || "10", 10);
		const role = url.searchParams.get("role");
		const search = url.searchParams.get("search");

		const allItems = [
			{
				id: "app-1",
				adoptionId: "adopt-101",
				petName: "Buddy",
				applicantName: "John Doe",
				status: "PENDING",
				role: "veterinarian",
				submittedAt: "2026-06-01T10:00:00Z",
			},
			{
				id: "app-2",
				adoptionId: "adopt-102",
				petName: "Luna",
				applicantName: "Jane Smith",
				status: "APPROVED",
				role: "shelter_admin",
				submittedAt: "2026-06-02T11:00:00Z",
			},
			{
				id: "app-3",
				adoptionId: "adopt-103",
				petName: "Max",
				applicantName: "Robert Brown",
				status: "REJECTED",
				role: "welfare_officer",
				submittedAt: "2026-06-03T12:00:00Z",
			},
			{
				id: "app-4",
				adoptionId: "adopt-104",
				petName: "Bella",
				applicantName: "Emily White",
				status: "PENDING",
				role: "admin",
				submittedAt: "2026-06-04T13:00:00Z",
			},
			{
				id: "app-5",
				adoptionId: "adopt-105",
				petName: "Charlie",
				applicantName: "David Green",
				status: "APPROVED",
				role: "veterinarian",
				submittedAt: "2026-06-05T14:00:00Z",
			},
		];

		let filtered = allItems;

		if (status) {
			filtered = filtered.filter(
				(item) => item.status.toLowerCase() === status.toLowerCase()
			);
		}

		if (role) {
			filtered = filtered.filter(
				(item) => item.role.toLowerCase() === role.toLowerCase()
			);
		}

		if (search) {
			const s = search.toLowerCase();
			filtered = filtered.filter(
				(item) =>
					item.petName.toLowerCase().includes(s) ||
					item.applicantName.toLowerCase().includes(s)
			);
		}

		const startIndex = (page - 1) * limit;
		const paginated = filtered.slice(startIndex, startIndex + limit);

		return HttpResponse.json({
			items: paginated,
			total: filtered.length,
			page,
			limit,
		});
	}),
];
