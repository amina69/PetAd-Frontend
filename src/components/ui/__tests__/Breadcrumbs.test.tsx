import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Breadcrumbs } from "../Breadcrumbs";

describe("Breadcrumbs", () => {
  it("renders a labelled trail with the current page marked", () => {
    render(
      <MemoryRouter>
        <Breadcrumbs
          items={[
            { label: "Administration", href: "/admin" },
            { label: "Disputes" },
          ]}
        />
      </MemoryRouter>,
    );

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Administration" })).toHaveAttribute(
      "href",
      "/admin",
    );
    expect(nav).toHaveTextContent("Administration/Disputes");

    const current = screen.getByText("Disputes");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).not.toHaveAttribute("href");
  });

  it("renders a single current crumb", () => {
    render(
      <MemoryRouter>
        <Breadcrumbs items={[{ label: "Administration" }]} ariaLabel="Admin trail" />
      </MemoryRouter>,
    );

    expect(screen.getByRole("navigation", { name: "Admin trail" })).toBeInTheDocument();
    expect(screen.getByText("Administration")).toHaveAttribute("aria-current", "page");
  });

  it("supports a custom separator and current override", () => {
    render(
      <MemoryRouter>
        <Breadcrumbs
          separator="›"
          items={[
            { label: "Home", href: "/" },
            { label: "Saved searches", href: "/saved", current: true },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("›").length).toBe(1);
    expect(screen.getByText("Saved searches")).toHaveAttribute("aria-current", "page");
  });

  it("renders nothing without items", () => {
    const { container } = render(
      <MemoryRouter>
        <Breadcrumbs items={[]} />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
