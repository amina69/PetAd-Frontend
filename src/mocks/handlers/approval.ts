import { http, HttpResponse, delay } from "msw";

const BASE_URL = "http://localhost:3000/api";

// ─── Handlers ─────────────────────────────────────────────────────────────────

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

	// GET /api/admin/approvals — admin approval queue
	http.get(`${BASE_URL}/admin/approvals`, async ({ request }: { request: Request }) => {
		await delay(1000);
		const url = new URL(request.url);
		const overdueOnly = url.searchParams.get("overdueOnly") === "true";
		const shelter = url.searchParams.get("shelter");
		
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
			// Simulating filtering
			items = items.filter(item => item.shelter.toLowerCase().includes(shelter.toLowerCase().replace('-', ' ')));
		}

		return HttpResponse.json({
			items,
			nextCursor: null
		});
	}),
];
