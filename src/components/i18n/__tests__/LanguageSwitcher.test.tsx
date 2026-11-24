import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { LOCALE_STORAGE_KEY, LanguageProvider } from "../../../i18n";

describe("LanguageSwitcher", () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.lang = "";
    document.documentElement.dir = "";
  });

  function renderSwitcher() {
    return render(
      <LanguageProvider initialLocale="en-GB">
        <LanguageSwitcher />
      </LanguageProvider>,
    );
  }

  it("lists every language by its own name", () => {
    renderSwitcher();

    const select = screen.getByRole("combobox", { name: "Language" });
    expect(select).toHaveValue("en-GB");

    for (const name of ["Français", "Español", "Português", "العربية"]) {
      expect(screen.getByRole("option", { name })).toBeInTheDocument();
    }
  });

  it("changes the UI language and persists it without a reload", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Language" }),
      "fr-FR",
    );

    expect(screen.getByRole("combobox", { name: "Langue" })).toHaveValue("fr-FR");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("fr-FR");
    expect(document.documentElement.lang).toBe("fr-FR");
  });
});
