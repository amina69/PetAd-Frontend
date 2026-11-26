import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import AdminLayout from "../AdminLayout";

describe("AdminLayout", () => {
  it("shows active navigation and route breadcrumbs", () => {
    render(<MemoryRouter initialEntries={["/admin/disputes"]}><Routes><Route path="/admin" element={<AdminLayout />}><Route path="disputes" element={<h1>Disputes queue</h1>} /></Route></Routes></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Disputes queue" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toHaveTextContent("Administration/Disputes");
    expect(screen.getAllByRole("link", { name: "Disputes" })[0]).toHaveAttribute("aria-current", "page");
  });

  it("opens the mobile drawer and closes it after choosing a route", () => {
    render(<MemoryRouter initialEntries={["/admin"]}><Routes><Route path="/admin" element={<AdminLayout />}><Route index element={<h1>Overview</h1>} /><Route path="users" element={<h1>Users queue</h1>} /></Route></Routes></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(screen.getByRole("navigation", { name: "Administration navigation" })).toHaveAttribute("id", "admin-mobile-nav");
    const usersLink = screen.getAllByRole("link", { name: "Users" }).at(-1);
    expect(usersLink).toBeDefined();
    if (usersLink) fireEvent.click(usersLink);
    expect(screen.getByRole("heading", { name: "Users queue" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close navigation" })).not.toBeInTheDocument();
  });
});
