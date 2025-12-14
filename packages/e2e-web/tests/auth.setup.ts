import { expect, test as setup } from "@playwright/test";
import { testUsers } from "../config";

const adminFile = "playwright/.auth/admin.json";

setup("authenticate as admin", async ({ page }) => {
  // Perform authentication steps. Replace these actions with your own.
  await page.goto("/");
  await page.waitForSelector("data-testid=auth.login.form.email");
  await page.getByTestId("auth.login.form.email").fill(testUsers.admin.email);
  await page.getByTestId("auth.login.form.password").fill(testUsers.admin.password);

  const getSessionResponse = page.waitForResponse(
    (response) => response.url().includes("/api/auth/get-session") && response.status() === 200
  );
  await page.getByTestId("auth.login.form.submit").click();

  await getSessionResponse;

  await page.waitForSelector("data-testid=app.sidebar.user-menu-trigger");

  // End of authentication steps.

  await page.context().storageState({ path: adminFile });
});
