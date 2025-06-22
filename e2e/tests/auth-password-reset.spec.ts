import { expect, test } from "@playwright/test";

test("forgot-password", async ({ page }) => {
  await page.goto("/auth/forgot-password");
  const expectedVisibleTestIds = [
    "auth.forgot-password.page",
    "auth.forgot-password.form",
    "auth.forgot-password.form.email",
    "auth.forgot-password.form.submit",
  ];
  for (const testId of expectedVisibleTestIds) {
    await expect(page.getByTestId(testId)).toBeVisible();
  }
});
