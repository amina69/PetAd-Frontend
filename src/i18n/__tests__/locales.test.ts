import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LOCALE_STORAGE_KEY,
  detectBrowserLocale,
  getTextDirection,
  normalizeLocale,
  readStoredLocale,
  writeStoredLocale,
} from "../locales";

describe("locale helpers", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("normalises regional and language-only tags to a supported locale", () => {
    expect(normalizeLocale("en-US")).toBe("en-GB");
    expect(normalizeLocale("fr")).toBe("fr-FR");
    expect(normalizeLocale("pt_BR")).toBe("pt-BR");
    expect(normalizeLocale("de-DE")).toBeNull();
    expect(normalizeLocale(null)).toBeNull();
  });

  it("detects the first supported navigator language", () => {
    Object.defineProperty(navigator, "languages", {
      configurable: true,
      value: ["de-DE", "fr-CA"],
    });

    expect(detectBrowserLocale()).toBe("fr-FR");
  });

  it("reads and writes the stored choice, tolerating storage failures", () => {
    writeStoredLocale("es-ES");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("es-ES");
    expect(readStoredLocale()).toBe("es-ES");

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    expect(() => writeStoredLocale("ar-EG")).not.toThrow();
  });

  it("exposes RTL only for Arabic", () => {
    expect(getTextDirection("ar-EG")).toBe("rtl");
    expect(getTextDirection("fr-FR")).toBe("ltr");
  });
});
