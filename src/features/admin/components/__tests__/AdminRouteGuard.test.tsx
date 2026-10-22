import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { AdminRouteGuard } from "../AdminRouteGuard";

describe("AdminRouteGuard", () => {
  beforeEach(() => localStorage.clear());

  it("redirects non-admin users before rendering admin route content", () => {
    localStorage.setItem("petad_user_role", "USER");
    render(<MemoryRouter initialEntries={["/admin/users"]}><Routes>
      <Route path="/admin/*" element={<AdminRouteGuard />}><Route path="*" element={<div>Admin module</div>} /></Route>
      <Route path="/403" element={<h1>Forbidden</h1>} />
    </Routes></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Forbidden" })).toBeInTheDocument();
    expect(screen.queryByText("Admin module")).not.toBeInTheDocument();
  });

  it("allows an administrator to enter the route", () => {
    localStorage.setItem("petad_user_role", "ADMIN");
    render(<MemoryRouter initialEntries={["/admin/users"]}><Routes>
      <Route path="/admin/*" element={<AdminRouteGuard />}><Route path="*" element={<div>Admin module</div>} /></Route>
      <Route path="/403" element={<h1>Forbidden</h1>} />
    </Routes></MemoryRouter>);
    expect(screen.getByText("Admin module")).toBeInTheDocument();
  });
});
