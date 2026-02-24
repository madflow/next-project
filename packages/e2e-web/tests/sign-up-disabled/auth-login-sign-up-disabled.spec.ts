import { expect, test } from "@playwright/test";

test("login page does not show sign-up link", { tag: ["@sign-up-disabled"] }, async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("auth.login.form.sign-up")).toBeHidden();
});
