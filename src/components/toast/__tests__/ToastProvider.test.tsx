import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, toast } from "../ToastProvider";
import { useToast } from "../useToast";

function ToastTrigger() {
  const { showToast } = useToast();

  return (
    <div>
      <button
        onClick={() =>
          showToast({
            type: "success",
            title: "Success toast",
            message: "Saved",
          })
        }
      >
        Add success
      </button>
      <button
        onClick={() =>
          showToast({
            type: "error",
            title: "Error toast",
            message: "Failed",
          })
        }
      >
        Add error
      </button>
      <button
        onClick={() => {
          for (let index = 1; index <= 4; index += 1) {
            showToast({
              type: "info",
              title: `Info ${index}`,
              message: `Toast ${index}`,
            });
          }
        }}
      >
        Add four
      </button>
    </div>
  );
}

function renderToastProvider() {
  return render(
    <ToastProvider>
      <ToastTrigger />
    </ToastProvider>,
  );
}

describe("ToastProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("queues toasts and keeps maximum of 3 visible", () => {
    renderToastProvider();

    fireEvent.click(screen.getByRole("button", { name: "Add four" }));
    expect(screen.getAllByTestId("toast-item")).toHaveLength(3);
    expect(screen.queryByText("Info 4")).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Dismiss toast" })[0]);
    expect(screen.getAllByTestId("toast-item")).toHaveLength(3);
    expect(screen.getByText("Info 4")).toBeInTheDocument();
  });

  it("auto dismisses toasts based on default timers", () => {
    renderToastProvider();

    fireEvent.click(screen.getByRole("button", { name: "Add success" }));
    fireEvent.click(screen.getByRole("button", { name: "Add error" }));

    expect(screen.getByText("Success toast")).toBeInTheDocument();
    expect(screen.getByText("Error toast")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(screen.queryByText("Success toast")).not.toBeInTheDocument();
    expect(screen.getByText("Error toast")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3_000);
    });

    expect(screen.queryByText("Error toast")).not.toBeInTheDocument();
  });

  it("manually dismisses toast", () => {
    renderToastProvider();

    fireEvent.click(screen.getByRole("button", { name: "Add success" }));
    expect(screen.getByText("Success toast")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss toast" }));
    expect(screen.queryByText("Success toast")).not.toBeInTheDocument();
  });

  it("sets correct accessibility role", () => {
    renderToastProvider();

    fireEvent.click(screen.getByRole("button", { name: "Add success" }));
    fireEvent.click(screen.getByRole("button", { name: "Add error" }));

    const statusToast = screen.getByText("Success toast").closest('[role="status"]');
    const alertToast = screen.getByText("Error toast").closest('[role="alert"]');

    expect(statusToast).toBeInTheDocument();
    expect(alertToast).toBeInTheDocument();
    expect(statusToast).toHaveAttribute("aria-live", "polite");
    expect(alertToast).toHaveAttribute("aria-live", "assertive");
  });

  it("pauses while hovered and resumes after the pointer leaves", () => {
    renderToastProvider();
    fireEvent.click(screen.getByRole("button", { name: "Add success" }));
    const item = screen.getByTestId("toast-item");

    fireEvent.mouseEnter(item);
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(screen.getByText("Success toast")).toBeInTheDocument();

    fireEvent.mouseLeave(item);
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(screen.queryByText("Success toast")).not.toBeInTheDocument();
  });

  it("dismisses the focused toast with Escape", () => {
    renderToastProvider();
    fireEvent.click(screen.getByRole("button", { name: "Add success" }));
    fireEvent.keyDown(screen.getByTestId("toast-item"), { key: "Escape" });
    expect(screen.queryByText("Success toast")).not.toBeInTheDocument();
  });

  it("exposes toast.success, toast.error, and toast.info", () => {
    renderToastProvider();
    act(() => {
      toast.success({ title: "Saved", description: "All set", durationMs: 1000 });
      toast.error({ title: "Failed", description: "Try again" });
      toast.info({ title: "Note", description: "Heads up" });
    });
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("Failed").closest("[role='alert']")).toHaveAttribute("aria-live", "assertive");
    expect(screen.getByText("Note").closest("[role='status']")).toHaveAttribute("aria-live", "polite");
  });
});
