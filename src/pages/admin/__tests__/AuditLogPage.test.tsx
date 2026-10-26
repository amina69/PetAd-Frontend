import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuditLogPage from "../AuditLogPage";
import { adminService } from "../../../api/adminService";
import * as csv from "../../../utils/csv";

vi.mock("../../../api/adminService");

const entries = [
  {
    id: "1",
    actorId: "u1",
    actorName: "=HYPERLINK(\"x\")",
    action: "USER_SUSPENDED",
    createdAt: "2026-03-01T10:00:00.000Z",
    metadata: { note: "<script>alert(1)</script>" },
  },
];

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuditLogPage />
    </QueryClientProvider>,
  );
}

describe("AuditLogPage", () => {
  beforeEach(() => {
    localStorage.setItem("petad_user_role", "ADMIN");
    vi.mocked(adminService.getAuditLog).mockResolvedValue(entries);
  });

  it("blocks non-admins", () => {
    localStorage.setItem("petad_user_role", "USER");
    renderPage();
    expect(screen.getByText("Access denied")).toBeInTheDocument();
  });

  it("renders metadata containing <script> as inert text", async () => {
    const { container } = renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Details" }));
    expect(screen.getByText(/<script>alert\(1\)<\/script>/)).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
  });

  it("passes filters to the service", async () => {
    renderPage();
    await screen.findByRole("cell", { name: "USER_SUSPENDED" });
    fireEvent.change(screen.getByLabelText("Actor"), { target: { value: "u1" } });
    await waitFor(() =>
      expect(adminService.getAuditLog).toHaveBeenLastCalledWith(
        expect.objectContaining({ actor: "u1" }),
      ),
    );
  });

  it("exports the current view with formula cells neutralised", async () => {
    const spy = vi.spyOn(csv, "downloadCsv").mockImplementation(() => {});
    renderPage();
    await screen.findByRole("cell", { name: "USER_SUSPENDED" });
    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][1]).toContain("'=HYPERLINK");
  });
});
