import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiStatusBanner } from "../ApiStatusBanner";
import {
	FAILURE_THRESHOLD,
	reportApiFailure,
	reportApiSuccess,
	resetApiHealth,
} from "../../../lib/apiHealth";

describe("ApiStatusBanner", () => {
	beforeEach(() => {
		resetApiHealth();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("does not render for a single failing request", () => {
		render(<ApiStatusBanner />);

		act(() => {
			reportApiFailure();
		});

		expect(
			screen.queryByText(/having trouble reaching the server/i),
		).not.toBeInTheDocument();
	});

	it("renders a non-blocking, announced banner after repeated failures", () => {
		render(<ApiStatusBanner />);

		act(() => {
			for (let index = 0; index < FAILURE_THRESHOLD; index++) {
				reportApiFailure();
			}
		});

		const banner = screen.getByRole("status");
		expect(banner).toHaveTextContent(
			/having trouble reaching the server/i,
		);
		expect(banner).toHaveAttribute("aria-live", "polite");
	});

	it("hides automatically after recovery", () => {
		render(<ApiStatusBanner />);

		act(() => {
			for (let index = 0; index < FAILURE_THRESHOLD; index++) {
				reportApiFailure();
			}
		});
		expect(screen.getByRole("status")).toBeInTheDocument();

		act(() => {
			reportApiSuccess();
		});

		expect(screen.queryByRole("status")).not.toBeInTheDocument();
	});

	it("links to the status page when VITE_STATUS_PAGE_URL is set", () => {
		vi.stubEnv("VITE_STATUS_PAGE_URL", "https://status.example.com");
		render(<ApiStatusBanner />);

		act(() => {
			for (let index = 0; index < FAILURE_THRESHOLD; index++) {
				reportApiFailure();
			}
		});

		const link = screen.getByRole("link", { name: /view status page/i });
		expect(link).toHaveAttribute("href", "https://status.example.com");
		expect(link).toHaveAttribute("target", "_blank");
	});

	it("renders without a link when no status page is configured", () => {
		vi.stubEnv("VITE_STATUS_PAGE_URL", "");
		render(<ApiStatusBanner />);

		act(() => {
			for (let index = 0; index < FAILURE_THRESHOLD; index++) {
				reportApiFailure();
			}
		});

		expect(
			screen.queryByRole("link", { name: /view status page/i }),
		).not.toBeInTheDocument();
	});
});
