import { expect, test } from "@playwright/test";
import { smtpServerApi } from "../utils";

let signUpUser: {
  email: string;
  password: string;
  name: string;
};

test.beforeAll(async () => {
  signUpUser = {
    email: `e2e-sign-up-${crypto.randomUUID()}@example.com`,
    password: crypto.randomUUID(),
    name: "E2E User",
  };
});

test.afterAll(async () => {
  await smtpServerApi.deleteMessagesBySearch({ query: `to:"${signUpUser.email}"` });
});

test("sign-up", async ({ page }) => {
  await page.goto("/auth/sign-up");
  const expectedVisibleTestIds = [
    "auth.sign-up.page",
    "auth.sign-up.form",
    "auth.sign-up.form.email",
    "auth.sign-up.form.name",
    "auth.sign-up.form.password",
    "auth.sign-up.form.confirm-password",
    "auth.sign-up.form.submit",
  ];
  for (const testId of expectedVisibleTestIds) {
    await expect(page.getByTestId(testId)).toBeVisible();
  }
  await page.getByTestId("auth.sign-up.form.email").fill(signUpUser.email);
  await page.getByTestId("auth.sign-up.form.password").fill(signUpUser.password);
  await page.getByTestId("auth.sign-up.form.confirm-password").fill(signUpUser.password);
  await page.getByTestId("auth.sign-up.form.name").fill(signUpUser.name);
  await page.getByTestId("auth.sign-up.form.submit").click();

  await expect(page.getByTestId("auth.login.page")).toBeVisible();
  const searchMessages = await smtpServerApi.searchMessages({
    query: `to:"${signUpUser.email}"`,
  });

  expect(searchMessages.messages.length).toBe(1);
  const message = searchMessages.messages[0];
  const linkCheck = await smtpServerApi.linkCheck(message.ID);
  let verifyLink = "";
  for (const link of linkCheck.Links) {
    if (link.URL.includes("verify-email")) {
      verifyLink = link.URL;
    }
  }
  expect(verifyLink).toBeTruthy();
  await page.goto(verifyLink);
  await expect(page.getByTestId("auth.login.page")).toBeVisible();

  await page.getByTestId("auth.login.form.email").fill(signUpUser.email);
  await page.getByTestId("auth.login.form.password").fill(signUpUser.password);
  await page.getByTestId("auth.login.form.submit").click();

  // Wait for navigation away from login
  await page.waitForURL((url) => !url.pathname.includes("/auth/login"), { timeout: 10000 });

  // Handle potential chunk loading errors by reloading
  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      const errorOverlay = await page.locator('dialog[role="dialog"]').count();
      if (errorOverlay > 0) {
        await page.reload({ waitUntil: "networkidle" });
      }

      await page.waitForSelector("data-testid=app.sidebar.user-menu-trigger", {
        state: "visible",
        timeout: 15000,
      });
      break;
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }
      await page.reload({ waitUntil: "networkidle" });
    }
  }

  await page.getByTestId("app.sidebar.user-menu-trigger").click();
  await expect(page.getByTestId("app.sign-out")).toBeVisible();
});
