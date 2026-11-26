import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PetSortSelect } from "../PetSortSelect";

describe("PetSortSelect", () => {
  it("renders the result count", () => {
    const { container } = render(
      <PetSortSelect
        value="newest"
        onChange={vi.fn()}
        resultCount={42}
        hasLocation={false}
      />,
    );
    const liveEl = container.querySelector("[aria-live='polite']");
    expect(liveEl?.textContent).toContain("42");
    expect(liveEl?.textContent).toContain("pets");
  });

  it("uses singular 'pet' when count is 1", () => {
    const { container } = render(
      <PetSortSelect
        value="newest"
        onChange={vi.fn()}
        resultCount={1}
        hasLocation={false}
      />,
    );
    const liveEl = container.querySelector("[aria-live='polite']");
    expect(liveEl?.textContent).toContain("1");
    expect(liveEl?.textContent).not.toContain("pets");
    expect(liveEl?.textContent).toContain("pet");
  });

  it("result count has aria-live='polite'", () => {
    const { container } = render(
      <PetSortSelect
        value="newest"
        onChange={vi.fn()}
        resultCount={10}
        hasLocation={false}
      />,
    );
    const live = container.querySelector("[aria-live='polite']");
    expect(live).toBeTruthy();
  });

  it("renders all four sort options", () => {
    render(
      <PetSortSelect
        value="newest"
        onChange={vi.fn()}
        resultCount={5}
        hasLocation={true}
      />,
    );
    const select = screen.getByRole("combobox");
    const options = Array.from(select.querySelectorAll("option")).map(
      (o) => o.value,
    );
    expect(options).toContain("newest");
    expect(options).toContain("nearest");
    expect(options).toContain("youngest");
    expect(options).toContain("oldest");
  });

  it("disables 'Nearest' when hasLocation is false", () => {
    render(
      <PetSortSelect
        value="newest"
        onChange={vi.fn()}
        resultCount={5}
        hasLocation={false}
      />,
    );
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    const nearestOption = Array.from(select.querySelectorAll("option")).find(
      (o) => o.value === "nearest",
    ) as HTMLOptionElement | undefined;
    expect(nearestOption?.disabled).toBe(true);
  });

  it("enables 'Nearest' when hasLocation is true", () => {
    render(
      <PetSortSelect
        value="newest"
        onChange={vi.fn()}
        resultCount={5}
        hasLocation={true}
      />,
    );
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    const nearestOption = Array.from(select.querySelectorAll("option")).find(
      (o) => o.value === "nearest",
    ) as HTMLOptionElement | undefined;
    expect(nearestOption?.disabled).toBe(false);
  });

  it("calls onChange when a new sort is selected", () => {
    const onChange = vi.fn();
    render(
      <PetSortSelect
        value="newest"
        onChange={onChange}
        resultCount={5}
        hasLocation={false}
      />,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "oldest" },
    });
    expect(onChange).toHaveBeenCalledWith("oldest");
  });

  it("default sort 'newest' is pre-selected", () => {
    render(
      <PetSortSelect
        value="newest"
        onChange={vi.fn()}
        resultCount={5}
        hasLocation={false}
      />,
    );
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe(
      "newest",
    );
  });
});
