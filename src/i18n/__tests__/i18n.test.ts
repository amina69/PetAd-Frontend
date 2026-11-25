import { afterEach, describe, expect, it } from "vitest";
import i18n from "../index";

describe("internationalization", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("loads locale resources on demand and updates the document language", async () => {
    await i18n.changeLanguage("es");

    expect(i18n.t("navigation.home")).toBe("Inicio");
    expect(document.documentElement.lang).toBe("es");
  });

  it("falls back to English resources for an unsupported locale", async () => {
    await i18n.changeLanguage("fr");

    expect(i18n.t("navigation.home")).toBe("Home");
    expect(document.documentElement.lang).toBe("fr");
  });
});
