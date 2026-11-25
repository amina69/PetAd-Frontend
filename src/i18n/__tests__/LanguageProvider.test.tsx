import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider, useLocale } from "../LanguageProvider";
import { LOCALE_STORAGE_KEY } from "../locales";
import { languagePreferenceService } from "../../api/preferencesService";

vi.mock("../../api/preferencesService", () => ({
  languagePreferenceService: {
    getLanguage: vi.fn().mockResolvedValue(null),
    setLanguage: vi.fn().mockResolvedValue(undefined),
  },
}));

const mockedService = vi.mocked(languagePreferenceService);

function Probe() {
  const { locale, dir, t, setLocale } = useLocale();

  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="dir">{dir}</span>
      <span data-testid="greeting">{t("nav.home")}</span>
      <button type="button" onClick={() => setLocale("ar-EG")}>
        switch
      </button>
    </div>
  );
}

describe("LanguageProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mockedService.getLanguage.mockResolvedValue(null);
    mockedService.setLanguage.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    document.documentElement.lang = "";
    document.documentElement.dir = "";
  });

  it("uses the stored choice over browser detection", () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "fr-FR");

    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("fr-FR");
    expect(screen.getByTestId("greeting")).toHaveTextContent("Accueil");
  });

  it("switches live, persists the choice and updates document direction", () => {
    render(
      <LanguageProvider initialLocale="en-GB">
        <Probe />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "switch" }));

    expect(screen.getByTestId("locale")).toHaveTextContent("ar-EG");
    expect(screen.getByTestId("dir")).toHaveTextContent("rtl");
    expect(screen.getByTestId("greeting")).toHaveTextContent("الرئيسية");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("ar-EG");
    expect(document.documentElement.lang).toBe("ar-EG");
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("does not break when storage is unavailable", () => {
    render(
      <LanguageProvider initialLocale="en-GB">
        <Probe />
      </LanguageProvider>,
    );

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: "switch" })),
    ).not.toThrow();
    expect(screen.getByTestId("locale")).toHaveTextContent("ar-EG");
  });

  it("hydrates the locale from the signed-in profile", async () => {
    localStorage.setItem("auth_token", "token");
    mockedService.getLanguage.mockResolvedValue("es-ES");

    render(
      <LanguageProvider initialLocale="en-GB">
        <Probe />
      </LanguageProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("locale")).toHaveTextContent("es-ES");
    });
    expect(screen.getByTestId("greeting")).toHaveTextContent("Inicio");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("es-ES");
  });

  it("persists a new choice to the profile when signed in", () => {
    localStorage.setItem("auth_token", "token");

    render(
      <LanguageProvider initialLocale="en-GB">
        <Probe />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "switch" }));

    expect(mockedService.setLanguage).toHaveBeenCalledWith("ar-EG");
  });
});
