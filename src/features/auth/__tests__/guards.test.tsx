import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { AccountPage } from "../AccountPage";
import { establishSession } from "../session";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<h1>Welcome Pet Lover!</h1>} />
        <Route path="/home" element={<h1>Home</h1>} />
        <Route path="/account" element={<AccountPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("auth guards", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("sends an anonymous visitor to login and keeps the return path", () => {
    renderAt("/account");
    expect(screen.getByRole("heading", { name: "Welcome Pet Lover!" })).toBeInTheDocument();
    expect(sessionStorage.getItem("petad_return_to")).toBe("/account");
  });

  it("sends a signed-in user with the wrong role home", () => {
    establishSession("guest");
    renderAt("/account");
    expect(screen.getByRole("heading", { name: "Home" })).toBeInTheDocument();
  });

  it("shows the account page for an allowed role", () => {
    establishSession("user");
    renderAt("/account");
    expect(screen.getByRole("heading", { name: "Your account" })).toBeInTheDocument();
  });
});
