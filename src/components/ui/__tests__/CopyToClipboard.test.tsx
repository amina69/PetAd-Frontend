import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CopyToClipboard } from "../CopyToClipboard";

const mockWriteText = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  Object.assign(navigator, {
    clipboard: { writeText: mockWriteText },
  });
  mockWriteText.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("CopyToClipboard", () => {
  it("renders the children as button label", () => {
    render(<CopyToClipboard value="abc123">Copy address</CopyToClipboard>);
    expect(screen.getByText("Copy address")).toBeTruthy();
  });

  it("has the correct accessible label", () => {
    render(<CopyToClipboard value="abc123">Copy</CopyToClipboard>);
    expect(
      screen.getByRole("button", { name: /copy to clipboard/i }),
    ).toBeTruthy();
  });

  it("calls navigator.clipboard.writeText with the correct value on click", async () => {
    render(
      <CopyToClipboard value="stellar-address-xyz">Copy</CopyToClipboard>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /copy to clipboard/i }),
    );
    // flush the clipboard promise microtask
    await act(async () => {});
    expect(mockWriteText).toHaveBeenCalledWith("stellar-address-xyz");
  });

  it("shows 'Copied!' after a successful click", async () => {
    render(<CopyToClipboard value="abc123">Copy</CopyToClipboard>);
    fireEvent.click(
      screen.getByRole("button", { name: /copy to clipboard/i }),
    );
    await act(async () => {});
    expect(screen.getByText("Copied!")).toBeTruthy();
  });

  it("hides children text while in copied state", async () => {
    render(
      <CopyToClipboard value="abc123">Copy address</CopyToClipboard>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /copy to clipboard/i }),
    );
    await act(async () => {});
    expect(screen.getByText("Copied!")).toBeTruthy();
    expect(screen.queryByText("Copy address")).toBeNull();
  });

  it("reverts back to children text after 2000ms", async () => {
    render(
      <CopyToClipboard value="abc123">Copy address</CopyToClipboard>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /copy to clipboard/i }),
    );
    await act(async () => {});
    expect(screen.getByText("Copied!")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText("Copy address")).toBeTruthy();
    expect(screen.queryByText("Copied!")).toBeNull();
  });

  it("does not revert before 2000ms have elapsed", async () => {
    render(
      <CopyToClipboard value="abc123">Copy address</CopyToClipboard>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /copy to clipboard/i }),
    );
    await act(async () => {});
    expect(screen.getByText("Copied!")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(1999);
    });

    expect(screen.getByText("Copied!")).toBeTruthy();
  });

  it("clears the pending timer on unmount to prevent state updates", async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const { unmount } = render(
      <CopyToClipboard value="abc123">Copy</CopyToClipboard>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /copy to clipboard/i }),
    );
    await act(async () => {});
    expect(screen.getByText("Copied!")).toBeTruthy();

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("resets the 2s timer if clicked again while already in copied state", async () => {
    render(
      <CopyToClipboard value="abc123">Copy address</CopyToClipboard>,
    );
    const button = screen.getByRole("button", { name: /copy to clipboard/i });

    // First click
    fireEvent.click(button);
    await act(async () => {});
    expect(screen.getByText("Copied!")).toBeTruthy();

    // Advance 1s then click again — timer should reset
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.click(button);
    await act(async () => {});

    // 1999ms after second click — still copied
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(screen.getByText("Copied!")).toBeTruthy();

    // 1ms more — now reverts
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText("Copy address")).toBeTruthy();
  });
});