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
  // expect to navigate to /dasboard
  await expect(page).toHaveURL("/project/test-project/adhoc");
  await logoutUser(page);

  await loginUser(page, testUsers.admin.email, testUsers.admin.password);
  // expect to navigate to /dasboard
  await expect(page).toHaveURL("/project/test-project/adhoc");

  await logoutUser(page);
});
