import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser, logoutUser } from "../utils";

test("login", async ({ page }) => {
  await page.goto("/");
  const expectedVisibleTestIds = [
    "auth.login.page",
    "auth.login.form",
    "auth.login.form.email",
    "auth.login.form.password",
    "auth.login.form.submit",
    "auth.login.form.sign-up",
    "auth.login.form.forgot-password",
  ];
  for (const testId of expectedVisibleTestIds) {
    await expect(page.getByTestId(testId)).toBeVisible();
  }
  await loginUser(page, testUsers.regularUser.email, testUsers.regularUser.password);
  // regularUser has 1 org and 1 project, so should be auto-redirected to project page
  await expect(page).toHaveURL("/project/test-project");
  await logoutUser(page);

  await loginUser(page, testUsers.admin.email, testUsers.admin.password);
  // admin has 1 org and 1 project (same as regularUser), so should be auto-redirected
  await expect(page).toHaveURL("/project/test-project");

  await logoutUser(page);
});
