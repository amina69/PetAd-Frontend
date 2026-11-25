import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { http, HttpResponse } from "msw";
import { act, render, screen } from "@testing-library/react";
import { server } from "../../mocks/server";
import { Flag } from "../../components/Flag";
import {
  __resetFeatureFlagsForTests,
  getFeatureFlags,
  loadFeatureFlags,
} from "../flags";

describe("feature flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    __resetFeatureFlagsForTests();
  });

  it("loads known boolean flags and ignores unknown flag names", async () => {
    server.use(
      http.get("*/api/flags", () =>
        HttpResponse.json({
          darkMode: true,
          pushNotifications: false,
          unknownFeature: true,
        }),
      ),
    );

    await loadFeatureFlags();

    expect(getFeatureFlags()).toEqual({
      darkMode: true,
      pushNotifications: false,
      messaging: false,
    });
  });

  it("uses safe off defaults when the request fails", async () => {
    server.use(http.get("*/api/flags", () => HttpResponse.error()));

    await loadFeatureFlags();

    expect(getFeatureFlags()).toEqual({
      darkMode: false,
      pushNotifications: false,
      messaging: false,
    });
  });

  it("uses an explicitly enabled environment default when loading fails", async () => {
    vi.stubEnv("VITE_FLAG_MESSAGING", "true");
    __resetFeatureFlagsForTests();
    server.use(http.get("*/api/flags", () => HttpResponse.error()));

    await loadFeatureFlags();

    expect(getFeatureFlags().messaging).toBe(true);
    expect(getFeatureFlags().darkMode).toBe(false);
  });

  it("renders a Flag's children only when its typed flag is enabled", async () => {
    server.use(
      http.get("*/api/flags", () =>
        HttpResponse.json({ flags: { messaging: true } }),
      ),
    );

    render(
      createElement(Flag, {
        name: "messaging",
        children: "Messages enabled",
      }),
    );

    expect(screen.queryByText("Messages enabled")).not.toBeInTheDocument();
    await act(async () => {
      await loadFeatureFlags();
    });
    expect(screen.getByText("Messages enabled")).toBeInTheDocument();
  });
});
