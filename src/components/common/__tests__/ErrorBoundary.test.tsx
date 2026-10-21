import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppErrorBoundary } from "../ErrorBoundary";

function Boom() {
  throw new Error("page exploded");
}

function Shell() {
  return (
    <div>
      <nav>Site nav</nav>
      <AppErrorBoundary variant="route">
        <Boom />
      </AppErrorBoundary>
    </div>
  );
}

describe("ErrorBoundary", () => {
  it("keeps the nav shell usable when a page throws", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const resetSpy = vi.spyOn(queryClient, "resetQueries");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Shell />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText("Site nav")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go home" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(resetSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
