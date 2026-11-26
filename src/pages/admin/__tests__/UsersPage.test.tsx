import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import UsersPage from "../UsersPage";
import { adminService } from "../../../api/adminService";

vi.mock("../../../api/adminService");
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const user = {
  id: "u2",
  name: "Alice",
  email: "alice@example.com",
  role: "USER" as const,
  status: "ACTIVE" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
};
const detail = {
  ...user,
  activity: { adoptions: 1, listings: 2, disputes: 0 },
  recentDisputes: [],
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <UsersPage />
    </QueryClientProvider>,
  );
}

describe("UsersPage", () => {
  beforeEach(() => {
    localStorage.setItem("petad_user_role", "ADMIN");
    localStorage.setItem("petad_user_id", "admin-1");
    vi.mocked(adminService.listUsers).mockResolvedValue([user]);
    vi.mocked(adminService.getUser).mockResolvedValue(detail);
    vi.mocked(adminService.suspendUser).mockResolvedValue(user);
    vi.mocked(adminService.changeRole).mockResolvedValue(user);
  });

  it("debounces search", async () => {
    renderPage();
    await screen.findByText("Alice");
    fireEvent.change(screen.getByLabelText("Search users"), { target: { value: "ali" } });
    expect(adminService.listUsers).not.toHaveBeenCalledWith("ali");
    await waitFor(() => expect(adminService.listUsers).toHaveBeenCalledWith("ali"));
  });

  it("disables the role control for the admin's own account with an explanation", async () => {
    vi.mocked(adminService.getUser).mockResolvedValue({ ...detail, id: "admin-1" });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Alice" }));
    const select = await screen.findByLabelText("Role");
    expect(select).toBeDisabled();
    expect(select).toHaveAttribute("title", "You cannot change your own role");
    expect(screen.getByText("You cannot change your own role.")).toBeInTheDocument();
  });

  it("names the target role in the confirmation before changing it", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Alice" }));
    fireEvent.change(await screen.findByLabelText("Role"), { target: { value: "SHELTER" } });
    expect(screen.getByText(/from USER to SHELTER/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Change to SHELTER" }));
    await waitFor(() => expect(adminService.changeRole).toHaveBeenCalledWith("u2", "SHELTER"));
  });

  it("requires a reason to suspend", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Alice" }));
    fireEvent.click(await screen.findByRole("button", { name: "Suspend user" }));
    const confirm = screen.getByRole("button", { name: "Confirm suspension" });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Reason for suspension"), {
      target: { value: "Spam listings" },
    });
    fireEvent.click(confirm);
    await waitFor(() => expect(adminService.suspendUser).toHaveBeenCalledWith("u2", "Spam listings"));
  });
});
