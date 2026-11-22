import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { delay, http, HttpResponse } from "msw";
import { server } from "../../../../mocks/server";
import { NotificationPreferences, PREFERENCE_ROWS } from "../NotificationPreferences";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences as Preferences,
} from "../../../../types/notifications";

const PREFS_URL = "*/api/notifications/preferences";

/** In-memory backend so every test starts from the defaults. */
function mockBackend(initial: Preferences = { ...DEFAULT_NOTIFICATION_PREFERENCES }) {
  const state = { current: { ...initial }, patches: [] as Partial<Preferences>[] };
  server.use(
    http.get(PREFS_URL, () => HttpResponse.json(state.current)),
    http.patch(PREFS_URL, async ({ request }) => {
      const body = (await request.json()) as Partial<Preferences>;
      state.patches.push(body);
      state.current = { ...state.current, ...body };
      return HttpResponse.json(state.current);
    }),
  );
  return state;
}

function renderPreferences(queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})) {
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <NotificationPreferences />
    </QueryClientProvider>,
  );
  return { ...utils, queryClient };
}

function toggleFor(label: string) {
  return screen.getByRole("switch", { name: label });
}

describe("NotificationPreferences", () => {
  it("renders one switch per notification type reflecting the server state", async () => {
    mockBackend({ ...DEFAULT_NOTIFICATION_PREFERENCES, DISPUTE_RAISED: false });
    renderPreferences();

    expect(screen.getByRole("status", { name: /loading/i })).toBeInTheDocument();
    expect(await screen.findAllByRole("switch")).toHaveLength(PREFERENCE_ROWS.length);
    expect(toggleFor("Dispute raised")).toHaveAttribute("aria-checked", "false");
    expect(toggleFor("Escrow funded")).toHaveAttribute("aria-checked", "true");
  });

  it("optimistically toggles and persists only the changed type", async () => {
    const backend = mockBackend();
    renderPreferences();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("switch", { name: "Escrow funded" }));

    expect(toggleFor("Escrow funded")).toHaveAttribute("aria-checked", "false");
    await waitFor(() => expect(backend.patches).toEqual([{ ESCROW_FUNDED: false }]));
    await waitFor(() => expect(toggleFor("Escrow funded")).not.toBeDisabled());
    expect(toggleFor("Escrow funded")).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the saved value after a fresh load (round-trips through the backend)", async () => {
    mockBackend();
    const first = renderPreferences();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("switch", { name: "Custody expiring" }));
    await waitFor(() => expect(toggleFor("Custody expiring")).not.toBeDisabled());
    first.unmount();

    // A brand-new cache simulates a hard reload.
    renderPreferences();
    expect(await screen.findByRole("switch", { name: "Custody expiring" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("reverts the toggle and shows an inline error when the save fails", async () => {
    mockBackend();
    server.use(
      http.patch(PREFS_URL, async () => {
        await delay(20);
        return HttpResponse.json({ message: "boom" }, { status: 500 });
      }),
    );
    renderPreferences();
    const user = userEvent.setup();

    const toggle = await screen.findByRole("switch", { name: "Approval requested" });
    await user.click(toggle);

    // Optimistic state while the request is in flight.
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(toggle).toBeDisabled();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Couldn't save this change");
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(toggle).not.toBeDisabled();
    expect(toggle.getAttribute("aria-describedby")).toContain(alert.id);

    // The error is scoped to the failing row.
    const row = toggle.closest("li")!;
    expect(within(row).getByRole("alert")).toBe(alert);
  });

  it("clears the inline error once a retry succeeds", async () => {
    mockBackend();
    let fail = true;
    server.use(
      http.patch(PREFS_URL, async ({ request }) => {
        if (fail) return HttpResponse.json({}, { status: 500 });
        const body = await request.json();
        return HttpResponse.json({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...(body as object) });
      }),
    );
    renderPreferences();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("switch", { name: "Document expiring" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    fail = false;
    await user.click(toggleFor("Document expiring"));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("only rolls back the failed toggle when two saves overlap", async () => {
    const backend = mockBackend();
    server.use(
      http.patch(PREFS_URL, async ({ request }) => {
        const body = (await request.json()) as Partial<Preferences>;
        if ("ESCROW_FUNDED" in body) {
          await delay(30);
          return HttpResponse.json({}, { status: 500 });
        }
        backend.current = { ...backend.current, ...body };
        return HttpResponse.json(backend.current);
      }),
    );
    renderPreferences();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("switch", { name: "Escrow funded" }));
    await user.click(toggleFor("Settlement complete"));

    await screen.findByRole("alert");
    expect(toggleFor("Escrow funded")).toHaveAttribute("aria-checked", "true");
    expect(toggleFor("Settlement complete")).toHaveAttribute("aria-checked", "false");
  });

  it("shows an error when preferences cannot be loaded", async () => {
    server.use(http.get(PREFS_URL, () => HttpResponse.json({}, { status: 500 })));
    renderPreferences();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "couldn't load your notification preferences",
    );
  });
});
