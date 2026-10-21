import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../../../../mocks/server";
import { CustodyRequestForm } from "../CustodyRequestForm";
import type { PetSummary } from "../../../../types/pet";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PET: PetSummary = {
  id: "pet-1",
  name: "Buddy",
  species: "Dog",
  breed: "German Shepherd",
  age: "4 yrs old",
  imageUrl: "/assets/dog.png",
};

const CARETAKERS = [{ id: "user-2", name: "Jane Doe" }];

function renderForm(pet: PetSummary = PET) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/pets/pet-1/custody/new"]}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );

  return {
    queryClient,
    ...render(<CustodyRequestForm pet={pet} caretakers={CARETAKERS} />, {
      wrapper,
    }),
  };
}

function dayButton(date: string): HTMLButtonElement {
  return screen.getByTestId(`date-${date}`) as HTMLButtonElement;
}

/** Picks a start and an end day in the calendar. */
async function pickRange(
  user: ReturnType<typeof userEvent.setup>,
  start: string,
  end: string,
) {
  await user.click(dayButton(start));
  await user.click(dayButton(end));
}

/** Fills in the caretaker and picks a range. */
async function fillValidForm(
  user: ReturnType<typeof userEvent.setup>,
  { start = "2026-06-20", end = "2026-06-27" } = {},
) {
  await user.selectOptions(
    screen.getByLabelText(/Who will look after/i),
    "user-2",
  );
  await pickRange(user, start, end);
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("CustodyRequestForm", () => {
  beforeEach(() => {
    // Freeze "today" so the calendar always opens on June 2026.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 5, 15, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the pet summary header", () => {
    renderForm();

    const summary = screen.getByTestId("custody-pet-summary");
    expect(summary).toHaveTextContent("Buddy");
    expect(summary).toHaveTextContent("German Shepherd");
  });

  it("shows inline errors and never reaches the network when the form is invalid", async () => {
    const user = userEvent.setup();
    const post = vi.fn(() => HttpResponse.json({}, { status: 201 }));
    server.use(http.post("*/api/custody", post));

    renderForm();

    await user.click(screen.getByTestId("custody-request-continue"));

    // The caretaker is missing…
    expect(screen.getByTestId("custody-caretaker-error")).toHaveTextContent(
      "Select a caretaker",
    );
    // …and so is the period.
    expect(screen.getByTestId("date-range-error")).toBeInTheDocument();

    // The form stayed on the details step and nothing was sent.
    expect(screen.getByTestId("custody-request-form")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("summarises the period on the confirmation step", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillValidForm(user);
    await user.click(screen.getByTestId("custody-request-continue"));

    expect(screen.getByTestId("custody-request-confirmation")).toBeInTheDocument();
    expect(screen.getByTestId("custody-confirm-start")).toHaveTextContent(
      "20 Jun 2026",
    );
    expect(screen.getByTestId("custody-confirm-end")).toHaveTextContent(
      "27 Jun 2026",
    );
    expect(screen.getByTestId("custody-confirm-nights")).toHaveTextContent(
      "7 nights",
    );
    expect(screen.getByTestId("custody-confirm-caretaker")).toHaveTextContent(
      "Jane Doe",
    );
  });

  it("sends the request once the confirmation is accepted", async () => {
    const user = userEvent.setup();
    let body: unknown;

    server.use(
      http.post("*/api/custody", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          {
            id: "custody-42",
            petId: "pet-1",
            ownerId: "user-1",
            caretakerId: "user-2",
            startDate: "2026-06-20",
            endDate: "2026-06-27",
            status: "requested",
            notes: null,
            escrowStatus: null,
            escrowId: null,
          },
          { status: 201 },
        );
      }),
    );

    renderForm();

    await fillValidForm(user);
    await user.click(screen.getByTestId("custody-request-continue"));
    await user.click(screen.getByTestId("custody-request-submit"));

    await waitFor(() => expect(body).toBeDefined());

    expect(body).toMatchObject({
      petId: "pet-1",
      caretakerId: "user-2",
      startDate: "2026-06-20",
      endDate: "2026-06-27",
    });
  });

  it("sends the emergency contact and the notes", async () => {
    const user = userEvent.setup();
    let body: unknown;

    server.use(
      http.post("*/api/custody", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ id: "custody-42" }, { status: 201 });
      }),
    );

    renderForm();

    await user.type(
      screen.getByLabelText(/Emergency contact/i),
      "Sam Doe, +44 700 000 000",
    );
    await user.type(screen.getByLabelText(/Notes/i), "Needs his medication");
    await fillValidForm(user);
    await user.click(screen.getByTestId("custody-request-continue"));
    await user.click(screen.getByTestId("custody-request-submit"));

    await waitFor(() => expect(body).toBeDefined());

    expect(body).toMatchObject({
      emergencyContact: "Sam Doe, +44 700 000 000",
      notes: "Needs his medication",
    });
  });

  it("keeps the submit button disabled while the request is pending", async () => {
    const user = userEvent.setup();
    let resolveRequest: (() => void) | undefined;

    server.use(
      http.post("*/api/custody", async () => {
        await new Promise<void>((resolve) => {
          resolveRequest = resolve;
        });
        return HttpResponse.json({ id: "custody-42" }, { status: 201 });
      }),
    );

    renderForm();

    await fillValidForm(user);
    await user.click(screen.getByTestId("custody-request-continue"));
    await user.click(screen.getByTestId("custody-request-submit"));

    const submit = await screen.findByTestId("custody-request-submit");
    await waitFor(() => expect(submit).toBeDisabled());

    resolveRequest?.();
  });

  it("explains why the request was rejected", async () => {
    const user = userEvent.setup();

    server.use(
      http.post("*/api/custody", () =>
        HttpResponse.json(
          { message: "Dates overlap an existing custody" },
          { status: 409 },
        ),
      ),
    );

    renderForm();

    await fillValidForm(user);
    await user.click(screen.getByTestId("custody-request-continue"));
    await user.click(screen.getByTestId("custody-request-submit"));

    expect(await screen.findByTestId("custody-request-error")).toHaveTextContent(
      "Dates overlap an existing custody",
    );
  });

  it("disables the days the API reported as unavailable", async () => {
    renderForm({ ...PET, id: "pet-2", name: "Luna" });

    // pet-2 already has an arrangement covering 1–14 June 2026.
    await waitFor(() => expect(dayButton("2026-06-05")).toBeDisabled());
    expect(dayButton("2026-06-15")).not.toBeDisabled();
  });
});
