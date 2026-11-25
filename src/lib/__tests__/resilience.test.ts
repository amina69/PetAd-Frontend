import { afterEach, describe, expect, it, vi } from "vitest";
import {
  __resetResilienceForTests,
  getResilienceStatus,
  OUTAGE_FAILURE_THRESHOLD,
  recordApiFailure,
  recordApiSuccess,
} from "../resilience";

describe("API resilience status", () => {
  afterEach(() => {
    vi.useRealTimers();
    __resetResilienceForTests();
  });

  it("shows a service outage after the configured failure threshold", () => {
    for (let failure = 0; failure < OUTAGE_FAILURE_THRESHOLD - 1; failure += 1) {
      recordApiFailure();
    }
    expect(getResilienceStatus().serviceUnavailable).toBe(false);

    recordApiFailure();
    expect(getResilienceStatus().serviceUnavailable).toBe(true);
  });

  it("expires old failures and clears the outage after a successful response", () => {
    vi.useFakeTimers();
    recordApiFailure();
    recordApiFailure();
    vi.advanceTimersByTime(30_001);
    recordApiFailure();

    expect(getResilienceStatus().serviceUnavailable).toBe(false);

    recordApiFailure();
    recordApiFailure();
    expect(getResilienceStatus().serviceUnavailable).toBe(true);

    recordApiSuccess();
    expect(getResilienceStatus().serviceUnavailable).toBe(false);
  });
});
