import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LANGUAGE_PREFERENCE_ENDPOINT,
  languagePreferenceService,
} from "../preferencesService";
import { apiClient } from "../../lib/api-client";

vi.mock("../../lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedClient = vi.mocked(apiClient);

describe("languagePreferenceService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("reads the stored language from the profile endpoint", async () => {
    mockedClient.get.mockResolvedValue({ language: "fr-FR" });

    await expect(languagePreferenceService.getLanguage()).resolves.toBe("fr-FR");
    expect(mockedClient.get).toHaveBeenCalledWith(LANGUAGE_PREFERENCE_ENDPOINT);
  });

  it("returns null when the profile has no usable language", async () => {
    mockedClient.get.mockResolvedValue({ language: null });
    await expect(languagePreferenceService.getLanguage()).resolves.toBeNull();

    mockedClient.get.mockRejectedValue(new Error("offline"));
    await expect(languagePreferenceService.getLanguage()).resolves.toBeNull();
  });

  it("writes the language and never rejects when the request fails", async () => {
    mockedClient.patch.mockResolvedValue(undefined);
    await languagePreferenceService.setLanguage("es-ES");
    expect(mockedClient.patch).toHaveBeenCalledWith(
      LANGUAGE_PREFERENCE_ENDPOINT,
      { language: "es-ES" },
    );

    mockedClient.patch.mockRejectedValue(new Error("offline"));
    await expect(
      languagePreferenceService.setLanguage("ar-EG"),
    ).resolves.toBeUndefined();
  });
});
