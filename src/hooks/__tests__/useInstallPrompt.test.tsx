import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useInstallPrompt } from "../useInstallPrompt";

const DISMISSED_UNTIL_KEY = "petad:install-prompt-dismissed-until";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

describe("useInstallPrompt", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not show again for 30 days after the browser prompt is declined", async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event = new Event("beforeinstallprompt") as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "dismissed"; platform: string }>;
    };
    event.prompt = vi.fn().mockResolvedValue(undefined);
    event.userChoice = Promise.resolve({ outcome: "dismissed", platform: "web" });

    act(() => {
      window.dispatchEvent(event);
    });
    expect(result.current.canInstall).toBe(true);

    await act(async () => {
      await result.current.install();
    });

    expect(result.current.canInstall).toBe(false);
    expect(result.current.dismissed).toBe(true);
    expect(Number(localStorage.getItem(DISMISSED_UNTIL_KEY))).toBe(
      Date.now() + THIRTY_DAYS_MS,
    );
  });
});
