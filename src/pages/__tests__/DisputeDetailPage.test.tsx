import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DisputeDetailPage from "../DisputeDetailPage";
import { useDisputeDetails } from "../../hooks/useDisputeDetails";
import type { DisputeDetails } from "../../types/dispute";

vi.mock("../../hooks/useDisputeDetails", () => ({
	useDisputeDetails: vi.fn(),
}));

const baseDispute: DisputeDetails = {
	id: "dispute-001",
	adoptionId: "adoption-002",
	raisedBy: {
		id: "user-buyer-2",
		name: "Amara Okafor",
		role: "ADOPTER",
	},
	reason: "misrepresentation",
	description: "Pet's health condition was not accurately described in the listing.",
	status: "OPEN",
	slaDeadlineAt: "2026-03-28T18:00:00.000Z",
	escrow: {
		escrowId: "escrow-204",
		accountId: "GABCD1234PETADESCROWACCOUNT567890ABCDEF1234567890PETAD",
		onChainStatus: "DISPUTED",
	},
	evidence: [
		{
			id: "ev-001",
			fileName: "vet-health-report.pdf",
			downloadUrl:
				"https://res.cloudinary.com/petad/raw/upload/v1/disputes/dispute-001/vet-health-report.pdf",
			sha256:
				"9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
			mimeType: "application/pdf",
			submittedBy: {
				id: "user-buyer-2",
				name: "Amara Okafor",
				role: "ADOPTER",
			},
			submittedAt: "2026-03-23T11:00:00.000Z",
		},
	],
	timeline: [],
	resolution: null,
	createdAt: "2026-03-23T10:45:00.000Z",
	updatedAt: "2026-03-23T11:00:00.000Z",
};

function renderPage() {
	return render(
		<MemoryRouter initialEntries={["/disputes/dispute-001"]}>
			<Routes>
				<Route path="/disputes/:disputeId" element={<DisputeDetailPage />} />
			</Routes>
		</MemoryRouter>,
	);
}

describe("DisputeDetailPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders section skeletons while loading", () => {
		vi.mocked(useDisputeDetails).mockReturnValue({
			data: undefined,
			isLoading: true,
			isError: false,
			isForbidden: false,
			isNotFound: false,
			error: null,
		});

		renderPage();

		expect(screen.getAllByTestId("dispute-header-skeleton")).toHaveLength(3);
	});

	it("renders raised-by, badges, escrow, and evidence details", () => {
		vi.mocked(useDisputeDetails).mockReturnValue({
			data: baseDispute,
			isLoading: false,
			isError: false,
			isForbidden: false,
			isNotFound: false,
			error: null,
		});

		renderPage();

		expect(screen.getByText("Amara Okafor")).toBeInTheDocument();
		expect(screen.getByText("Adopter")).toBeInTheDocument();
		expect(screen.getByText("misrepresentation")).toBeInTheDocument();
		expect(screen.getByText("Open")).toBeInTheDocument();
		expect(screen.getByText("vet-health-report.pdf")).toBeInTheDocument();
		expect(screen.getByText(/SHA-256:/)).toBeInTheDocument();
		expect(screen.getByText("Disputed")).toBeInTheDocument();

		const accountLink = screen.getByRole("link", {
			name: /GABCD123/i,
		});
		expect(accountLink.getAttribute("href")).toContain("/account/");

		expect(screen.getByRole("button", { name: "Add evidence" })).toBeInTheDocument();
	});

	it("opens the evidence upload modal for open disputes", () => {
		vi.mocked(useDisputeDetails).mockReturnValue({
			data: baseDispute,
			isLoading: false,
			isError: false,
			isForbidden: false,
			isNotFound: false,
			error: null,
		});

		renderPage();
		fireEvent.click(screen.getByRole("button", { name: "Add evidence" }));

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Add supporting evidence")).toBeInTheDocument();
	});

	it("hides the evidence action for resolved disputes", () => {
		vi.mocked(useDisputeDetails).mockReturnValue({
			data: {
				...baseDispute,
				status: "RESOLVED",
			},
			isLoading: false,
			isError: false,
			isForbidden: false,
			isNotFound: false,
			error: null,
		});

		renderPage();

		expect(screen.queryByRole("button", { name: "Add evidence" })).toBeNull();
	});
});