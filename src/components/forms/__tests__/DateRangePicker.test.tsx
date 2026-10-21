import { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateRangePicker, type DateRange } from "../DateRangePicker";

// ─── Harness ─────────────────────────────────────────────────────────────────

interface HarnessProps {
  unavailableDates?: string[];
  minDate?: string;
  initial?: DateRange;
}

function Harness({
  unavailableDates = [],
  minDate = "2026-06-01",
  initial = { startDate: null, endDate: null },
}: HarnessProps) {
  const [value, setValue] = useState<DateRange>(initial);

  return (
    <div>
      <DateRangePicker
        value={value}
        onChange={setValue}
        unavailableDates={unavailableDates}
        minDate={minDate}
      />
      <output data-testid="range-value">
        {value.startDate ?? ""}|{value.endDate ?? ""}
      </output>
    </div>
  );
}

function dayButton(date: string): HTMLButtonElement {
  return screen.getByTestId(`date-${date}`) as HTMLButtonElement;
}

function selectedRange(): string {
  return screen.getByTestId("range-value").textContent ?? "";
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("DateRangePicker", () => {
  it("renders the month of the earliest selectable date", () => {
    render(<Harness minDate="2026-06-10" />);

    expect(screen.getByTestId("date-range-view-month")).toHaveTextContent(
      "June 2026",
    );
    expect(dayButton("2026-06-01")).toBeInTheDocument();
  });

  it("disables days before the earliest selectable date", () => {
    render(<Harness minDate="2026-06-10" />);

    expect(dayButton("2026-06-09")).toBeDisabled();
    expect(dayButton("2026-06-10")).not.toBeDisabled();
  });

  it("disables the days the API reported as unavailable", () => {
    render(<Harness unavailableDates={["2026-06-12"]} />);

    expect(dayButton("2026-06-12")).toBeDisabled();
    expect(dayButton("2026-06-12")).toHaveAttribute("data-unavailable");
    expect(dayButton("2026-06-11")).not.toBeDisabled();
  });

  it("selects a range and shows the number of nights", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(dayButton("2026-06-10"));
    expect(selectedRange()).toBe("2026-06-10|");

    await user.click(dayButton("2026-06-15"));
    expect(selectedRange()).toBe("2026-06-10|2026-06-15");
    expect(screen.getByTestId("date-range-nights")).toHaveTextContent(
      "5 nights",
    );
  });

  it("uses the singular form for a one-night period", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(dayButton("2026-06-10"));
    await user.click(dayButton("2026-06-11"));

    expect(screen.getByTestId("date-range-nights")).toHaveTextContent(
      "1 night",
    );
  });

  it("blocks a range that crosses an unavailable day with an explanatory message", async () => {
    const user = userEvent.setup();
    render(<Harness unavailableDates={["2026-06-12"]} />);

    await user.click(dayButton("2026-06-10"));
    await user.click(dayButton("2026-06-15"));

    // The range was rejected…
    expect(selectedRange()).toBe("2026-06-10|");
    // …and the reason is explained.
    const error = screen.getByTestId("date-range-error");
    expect(error).toHaveTextContent("12 Jun 2026");
    expect(error).toHaveTextContent("not available");
  });

  it("allows a range that stops before the unavailable day", async () => {
    const user = userEvent.setup();
    render(<Harness unavailableDates={["2026-06-12"]} />);

    await user.click(dayButton("2026-06-10"));
    await user.click(dayButton("2026-06-11"));

    expect(selectedRange()).toBe("2026-06-10|2026-06-11");
    expect(screen.queryByTestId("date-range-error")).toBeNull();
  });

  it("restarts the range when an earlier day is picked", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(dayButton("2026-06-10"));
    await user.click(dayButton("2026-06-15"));
    expect(selectedRange()).toBe("2026-06-10|2026-06-15");

    // Picking an earlier day starts a new range.
    await user.click(dayButton("2026-06-05"));
    expect(selectedRange()).toBe("2026-06-05|");
  });

  it("starts a new range when a day is picked in a completed range", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(dayButton("2026-06-10"));
    await user.click(dayButton("2026-06-15"));
    await user.click(dayButton("2026-06-20"));

    expect(selectedRange()).toBe("2026-06-20|");
  });

  it("moves the focus with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    dayButton("2026-06-10").focus();
    expect(document.activeElement).toBe(dayButton("2026-06-10"));

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(dayButton("2026-06-11"));

    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(dayButton("2026-06-18"));

    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(dayButton("2026-06-17"));

    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(dayButton("2026-06-10"));
  });

  it("moves the focus to the start and the end of the week", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    // 10 June 2026 is a Wednesday.
    dayButton("2026-06-10").focus();

    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(dayButton("2026-06-08"));

    await user.keyboard("{End}");
    expect(document.activeElement).toBe(dayButton("2026-06-14"));
  });

  it("changes month with PageDown and PageUp", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    dayButton("2026-06-10").focus();

    await user.keyboard("{PageDown}");
    expect(screen.getByTestId("date-range-view-month")).toHaveTextContent(
      "July 2026",
    );
    expect(document.activeElement).toBe(dayButton("2026-07-01"));

    await user.keyboard("{PageUp}");
    expect(screen.getByTestId("date-range-view-month")).toHaveTextContent(
      "June 2026",
    );
  });

  it("selects a day with the keyboard", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    dayButton("2026-06-10").focus();
    await user.keyboard("{Enter}");

    expect(selectedRange()).toBe("2026-06-10|");
  });

  it("changes the visible month with the navigation buttons", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByLabelText("Next month"));
    expect(screen.getByTestId("date-range-view-month")).toHaveTextContent(
      "July 2026",
    );

    await user.click(screen.getByLabelText("Previous month"));
    expect(screen.getByTestId("date-range-view-month")).toHaveTextContent(
      "June 2026",
    );
  });

  it("marks the selected days as pressed", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(dayButton("2026-06-10"));
    await user.click(dayButton("2026-06-12"));

    expect(dayButton("2026-06-10")).toHaveAttribute("aria-pressed", "true");
    expect(dayButton("2026-06-11")).toHaveAttribute("aria-pressed", "true");
    expect(dayButton("2026-06-12")).toHaveAttribute("aria-pressed", "true");
    expect(dayButton("2026-06-13")).toHaveAttribute("aria-pressed", "false");
  });
});
