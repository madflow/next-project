import { expect, test } from "@playwright/test";

test("login page shows sign-up link", { tag: ["@sign-up-enabled"] }, async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("auth.login.form.sign-up")).toBeVisible();
});
