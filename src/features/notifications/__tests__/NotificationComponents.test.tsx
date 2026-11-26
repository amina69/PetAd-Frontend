import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationCentreDropdown } from "../../../components/notifications/NotificationCentreDropdown";

describe("Notification Components Suite", () => {
  it("renders notification centre dropdown container correctly", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NotificationCentreDropdown />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByTestId("bell-button")).toBeInTheDocument();
  });
});
