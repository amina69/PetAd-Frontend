import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DateRangePicker } from "../DateRangePicker";
import { LanguageProvider } from "../../../i18n";

describe("DateRangePicker", () => {
  it("localises labels and exposes the locale's first day of week", () => {
    const { container } = render(
      <LanguageProvider initialLocale="ar-EG">
        <DateRangePicker value={{}} onChange={vi.fn()} />
      </LanguageProvider>,
    );

    expect(screen.getByLabelText("من")).toHaveAttribute("lang", "ar-EG");
    expect(screen.getByLabelText("إلى")).toHaveAttribute("lang", "ar-EG");
    expect(container.querySelector("[data-week-start]")).toHaveAttribute(
      "data-week-start",
      "6",
    );
  });

  it("keeps English labels for the default locale", () => {
    render(
      <LanguageProvider initialLocale="en-GB">
        <DateRangePicker value={{}} onChange={vi.fn()} />
      </LanguageProvider>,
    );

    expect(screen.getByLabelText("From")).toBeInTheDocument();
    expect(screen.getByLabelText("To")).toBeInTheDocument();
  });
});
