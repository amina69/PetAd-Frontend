import { describe, expect, it } from "vitest";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { delay, http, HttpResponse } from "msw";
import { server } from "../../../../mocks/server";
import {
  ESCROW_STATE_PRESENTATION,
  EscrowStatusPanel,
  UNKNOWN_ESCROW_STATE_PRESENTATION,
  getEscrowStatePresentation,
} from "../EscrowStatusPanel";

const ESCROW_URL = "/api/escrow/:id";

function renderPanel(props: ComponentProps<typeof EscrowStatusPanel>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EscrowStatusPanel {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("EscrowStatusPanel", () => {
  it("renders plain-language copy and a badge for a known state", async () => {
    server.use(
      http.get(ESCROW_URL, () => HttpResponse.json({ status: "FUNDED" })),
    );

    renderPanel({ escrowId: "escrow-001" });

    expect(await screen.findByTestId("escrow-status-badge")).toHaveTextContent(
      "Payment held",
    );
    expect(screen.getByTestId("escrow-status-description")).toHaveTextContent(
      "The adoption payment is being held safely.",
    );
  });

  it("reads the state from the escrow record endpoint", async () => {
    let requestedUrl = "";
    server.use(
      http.get(ESCROW_URL, ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({ status: "RELEASED" });
      }),
    );

    renderPanel({ escrowId: "escrow-042" });

    await screen.findByTestId("escrow-status-badge");
    expect(requestedUrl).toContain("/api/escrow/escrow-042");
  });

  it("falls back to a safe generic label for an unknown state", async () => {
    server.use(
      http.get(ESCROW_URL, () => HttpResponse.json({ status: "SOMETHING_NEW" })),
    );

    renderPanel({ escrowId: "escrow-001" });

    expect(await screen.findByTestId("escrow-status-badge")).toHaveTextContent(
      UNKNOWN_ESCROW_STATE_PRESENTATION.label,
    );
    expect(screen.getByTestId("escrow-status-description")).toHaveTextContent(
      UNKNOWN_ESCROW_STATE_PRESENTATION.description,
    );
    // The unrecognised value is never echoed back to the user.
    expect(screen.queryByText(/SOMETHING_NEW/)).not.toBeInTheDocument();
  });

  it("links a disputed payment to the dispute thread", async () => {
    server.use(
      http.get(ESCROW_URL, () =>
        HttpResponse.json({ status: "DISPUTED", disputeId: "dispute-001" }),
      ),
    );

    renderPanel({ escrowId: "escrow-001" });

    expect(await screen.findByTestId("escrow-status-badge")).toHaveTextContent(
      "Disputed",
    );
    const link = screen.getByTestId("escrow-dispute-link");
    expect(link).toHaveAttribute("href", "/disputes/dispute-001");
    expect(link).toHaveTextContent("View the dispute");
  });

  it("links a disputed payment to the dispute list when the thread is unknown", async () => {
    server.use(
      http.get(ESCROW_URL, () => HttpResponse.json({ status: "DISPUTED" })),
    );

    renderPanel({ escrowId: "escrow-001" });

    const link = await screen.findByTestId("escrow-dispute-link");
    expect(link).toHaveAttribute("href", "/disputes");
  });

  it("never surfaces keys, hashes or other record internals", async () => {
    server.use(
      http.get(ESCROW_URL, () =>
        HttpResponse.json({
          id: "escrow-001",
          status: "FUNDED",
          stellarPublicKey: "GPUBLICKEYVALUE",
          stellarSecretEncrypted: "SECRETVALUE",
          escrow_account_id: "GESCROWACCOUNT",
          fundingTxHash: "abc123fundtxhash",
          amount: 25000,
        }),
      ),
    );

    const { container } = renderPanel({ escrowId: "escrow-001" });

    await screen.findByTestId("escrow-status-badge");
    expect(container.textContent).not.toContain("GPUBLICKEYVALUE");
    expect(container.textContent).not.toContain("SECRETVALUE");
    expect(container.textContent).not.toContain("GESCROWACCOUNT");
    expect(container.textContent).not.toContain("abc123fundtxhash");
  });

  it("shows a loading state while the state is being fetched", async () => {
    server.use(
      http.get(ESCROW_URL, async () => {
        await delay(50);
        return HttpResponse.json({ status: "RELEASED" });
      }),
    );

    renderPanel({ escrowId: "escrow-001" });

    expect(screen.getByTestId("escrow-status-panel-loading")).toBeInTheDocument();
    await screen.findByTestId("escrow-status-badge");
  });

  it("shows a friendly error when the state cannot be loaded", async () => {
    server.use(
      http.get(ESCROW_URL, () =>
        HttpResponse.json({ message: "boom" }, { status: 500 }),
      ),
    );

    renderPanel({ escrowId: "escrow-001" });

    const error = await screen.findByTestId("escrow-status-panel-error");
    expect(error).toHaveTextContent("We couldn't load the payment status");
  });

  it("renders a state the caller already knows without issuing a request", () => {
    let wasRequested = false;
    server.use(
      http.get(ESCROW_URL, () => {
        wasRequested = true;
        return HttpResponse.json({ status: "FUNDED" });
      }),
    );

    renderPanel({ status: "RELEASED" });

    expect(screen.getByTestId("escrow-status-badge")).toHaveTextContent(
      "Payment released",
    );
    expect(wasRequested).toBe(false);
  });

  it("renders an empty state when there is no payment to describe", () => {
    renderPanel({});

    expect(screen.getByTestId("escrow-status-panel-empty")).toHaveTextContent(
      "No payment is attached to this yet.",
    );
  });
});

describe("getEscrowStatePresentation", () => {
  it("resolves every known state to a label and a description", () => {
    Object.values(ESCROW_STATE_PRESENTATION).forEach((presentation) => {
      expect(presentation.label.length).toBeGreaterThan(0);
      expect(presentation.description.length).toBeGreaterThan(0);
    });
  });

  it("normalises the state before resolving it", () => {
    expect(getEscrowStatePresentation("disputed").label).toBe("Disputed");
    expect(getEscrowStatePresentation("In Review").label).toBe("Under review");
    expect(getEscrowStatePresentation("in-review").label).toBe("Under review");
  });

  it("falls back to the generic label for missing or unknown states", () => {
    expect(getEscrowStatePresentation(undefined)).toBe(
      UNKNOWN_ESCROW_STATE_PRESENTATION,
    );
    expect(getEscrowStatePresentation(null)).toBe(
      UNKNOWN_ESCROW_STATE_PRESENTATION,
    );
    expect(getEscrowStatePresentation("")).toBe(
      UNKNOWN_ESCROW_STATE_PRESENTATION,
    );
    expect(getEscrowStatePresentation("NOT_A_STATE")).toBe(
      UNKNOWN_ESCROW_STATE_PRESENTATION,
    );
  });

  it("keeps blockchain jargon out of the visible copy", () => {
    const forbidden = /\b(stellar|xlm|blockchain|ledger|wallet|token|contract|hash|keys?|mint|burn|gas|network)\b/i;

    Object.values(ESCROW_STATE_PRESENTATION).forEach(({ label, description }) => {
      expect(label).not.toMatch(forbidden);
      expect(description).not.toMatch(forbidden);
    });

    expect(UNKNOWN_ESCROW_STATE_PRESENTATION.label).not.toMatch(forbidden);
    expect(UNKNOWN_ESCROW_STATE_PRESENTATION.description).not.toMatch(forbidden);
  });
});
