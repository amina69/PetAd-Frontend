import { expect, test } from "@playwright/test";
import path from "node:path";

const fixture = path.join(process.cwd(), "e2e", "fixtures", "sample.pdf");

test("uploads a fixture and lists it as Pending", async ({ page }) => {
  await page.goto("/documents");

  await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();

  await page.setInputFiles("#document-file", fixture);
  await page.getByRole("button", { name: "Upload" }).click();

  const uploaded = page.getByRole("listitem").filter({ hasText: "sample.pdf" });
  await expect(uploaded).toBeVisible();
  await expect(uploaded.getByTestId("document-status")).toHaveText("Pending");
});
