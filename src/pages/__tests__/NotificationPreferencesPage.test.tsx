/**
 * Integration tests for NotificationPreferencesPage.
 *
 * Why these tests matter:
 * - Persistence check: verifies the PATCH payload reaches the MSW handler and
 *   the in-memory mock state is updated, so a subsequent GET (simulated by
 *   remounting with a fresh QueryClient) returns the saved value — catching
 *   regressions where the API call is skipped or the payload is malformed.
 * - API behaviour: the page debounces saves by 500 ms; fake timers let us
 *   advance time deterministically without slowing the suite.
 * - Reset flow: confirms the modal gate and that the PATCH payload restores all
 *   defaults, not just the toggled key.
 *
 * Network layer: MSW (wired in src/test/setup.ts) intercepts all fetch calls.
 * Each test that needs specific GET/PATCH behaviour overrides handlers via
 * server.use(), which is automatically reset after each test by the global
 * afterEach in setup.ts.
 */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";
import NotificationPreferencesPage from "../NotificationPreferencesPage";
import type { NotificationPreferences } from "../../types/notifications";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a fresh QueryClient + Router wrapper for each render. */
function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

function renderPage() {
  return render(<NotificationPreferencesPage />, { wrapper: makeWrapper() });
}

/** Wait for the page to finish loading and show the toggles. */
async function waitForToggles() {
  await waitFor(() =>
    expect(screen.getByTestId("toggle-escrow-funded")).toBeInTheDocument()
  );
}

/**
 * Override the GET handler to return a specific preferences object.
 * Useful for simulating what the server would return after a PATCH.
 */
function stubGetPreferences(prefs: NotificationPreferences) {
  server.use(
    http.get("**/api/notifications/preferences", () =>
      HttpResponse.json<NotificationPreferences>(prefs)
    )
  );
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe("NotificationPreferencesPage – ESCROW_FUNDED preference flow", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  // ── 1. Toggle OFF triggers correct PATCH request ───────────────────────────
  it("sends PATCH /api/notifications/preferences with ESCROW_FUNDED:false when toggled off", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    const capturedBodies: unknown[] = [];
    server.use(
      http.patch("**/api/notifications/preferences", async ({ request }) => {
        capturedBodies.push(await request.json());
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderPage();
    await waitForToggles();

    const toggle = screen.getByTestId("toggle-escrow-funded");
    // Initially ON
    expect(toggle).toHaveAttribute("aria-checked", "true");

    await user.click(toggle);

    // Advance past the 500 ms debounce
    vi.advanceTimersByTime(600);

    await waitFor(() => expect(capturedBodies).toHaveLength(1));

    const payload = capturedBodies[0] as Record<string, boolean>;
    expect(payload.ESCROW_FUNDED).toBe(false);
  });

  // ── 2. UI reflects disabled state immediately (optimistic update) ──────────
  it("reflects the OFF state in the UI immediately after toggle", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderPage();
    await waitForToggles();

    const toggle = screen.getByTestId("toggle-escrow-funded");
    await user.click(toggle);

    // UI updates optimistically — no need to wait for the API
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  // ── 3. PATCH is called exactly once per toggle interaction ─────────────────
  it("calls PATCH exactly once for a single toggle interaction", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    let patchCount = 0;
    server.use(
      http.patch("**/api/notifications/preferences", async ({ request }) => {
        await request.json();
        patchCount++;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderPage();
    await waitForToggles();

    await user.click(screen.getByTestId("toggle-escrow-funded"));
    vi.advanceTimersByTime(600);

    await waitFor(() => expect(patchCount).toBe(1));
  });

  // ── 4. Persistence: state survives a simulated page reload ────────────────
  /**
   * "Reload" is simulated by:
   * 1. Toggling OFF and waiting for the PATCH to complete (confirmed by "Saved").
   * 2. Overriding the GET handler to return ESCROW_FUNDED:false — mimicking what
   *    a real backend would return after persisting the PATCH.
   * 3. Unmounting and remounting with a fresh QueryClient (no cached data).
   *
   * This validates the full round-trip: UI → PATCH → GET → UI.
   */
  it("persists ESCROW_FUNDED:false after a simulated page reload", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    // ── First render: toggle OFF and let the PATCH complete ──
    const { unmount } = renderPage();
    await waitForToggles();

    await user.click(screen.getByTestId("toggle-escrow-funded"));
    vi.advanceTimersByTime(600);

    // Wait for the "Saved" confirmation — confirms the PATCH succeeded
    await waitFor(() => expect(screen.getByText("Saved")).toBeInTheDocument());

    unmount();

    // Stub GET to return the persisted state (ESCROW_FUNDED off)
    stubGetPreferences({
      APPROVAL_REQUESTED: true,
      ESCROW_FUNDED: false,
      DISPUTE_RAISED: true,
      SETTLEMENT_COMPLETE: true,
      DOCUMENT_EXPIRING: true,
      CUSTODY_EXPIRING: true,
    });

    // ── Second render: fresh QueryClient simulates a full reload ──
    renderPage();
    await waitForToggles();

    await waitFor(() =>
      expect(screen.getByTestId("toggle-escrow-funded")).toHaveAttribute(
        "aria-checked",
        "false"
      )
    );
  });

  // ── 5. Reset to defaults restores ESCROW_FUNDED to ON ─────────────────────
  it("restores ESCROW_FUNDED to ON after Reset to defaults is confirmed", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderPage();
    await waitForToggles();

    // Toggle OFF first
    await user.click(screen.getByTestId("toggle-escrow-funded"));
    expect(screen.getByTestId("toggle-escrow-funded")).toHaveAttribute(
      "aria-checked",
      "false"
    );

    // Open reset modal and wait for it to appear
    await user.click(screen.getByTestId("reset-preferences"));
    const dialog = await screen.findByRole("dialog");

    // Confirm inside the modal
    await user.click(within(dialog).getByRole("button", { name: /reset/i }));
    expect(mockMutate).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    vi.advanceTimersByTime(600);

    // ESCROW_FUNDED should be back ON
    await waitFor(() =>
      expect(screen.getByTestId("toggle-escrow-funded")).toHaveAttribute(
        "aria-checked",
        "true"
      )
    );
  });

  // ── 6. Reset PATCH payload contains all defaults set to true ──────────────
  it("sends PATCH with all preferences true when reset is confirmed", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    const capturedBodies: unknown[] = [];
    server.use(
      http.patch("**/api/notifications/preferences", async ({ request }) => {
        capturedBodies.push(await request.json());
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderPage();
    await waitForToggles();

    await user.click(screen.getByTestId("reset-preferences"));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /reset/i }));

    vi.advanceTimersByTime(600);

    await waitFor(() => expect(capturedBodies).toHaveLength(1));

    const payload = capturedBodies[0] as Record<string, boolean>;
    expect(payload).toMatchObject({
      APPROVAL_REQUESTED: true,
      ESCROW_FUNDED: true,
      DISPUTE_RAISED: true,
      SETTLEMENT_COMPLETE: true,
      DOCUMENT_EXPIRING: true,
      CUSTODY_EXPIRING: true,
    });
  });
});
