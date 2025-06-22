import { expect, test } from "@playwright/test";
import { baseUrl } from "../config";

test.describe("Locale Switcher on Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should switch between English and German", async ({ page }) => {
    // Verify initial state (English)
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    // Switch to German
    await page.getByTestId("app.locale-switcher").click();
    await page.getByRole("option", { name: "German" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "de");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "de");

    // Switch back to English
    await page.getByTestId("app.locale-switcher").click();
    await page.getByRole("option", { name: "Englisch" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
