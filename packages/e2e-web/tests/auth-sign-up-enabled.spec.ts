import type { Page } from "@playwright/test";
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

async function completeEmailVerificationFlow(page: Page, email: string) {
  const searchMessages = await smtpServerApi.searchMessages({
    query: `to:"${email}"`,
  });

  if (searchMessages.messages.length === 0) {
    throw new Error(`No verification email found for ${email}`);
  }

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
  await expect(page.getByTestId("auth.verify-email.page")).toBeVisible();
  await page.getByTestId("verify-email.login").click();
  await expect(page.getByTestId("auth.login.page")).toBeVisible();
}

async function performLogin(page: Page, email: string, password: string) {
  await page.getByTestId("auth.login.form.email").fill(email);
  await page.getByTestId("auth.login.form.password").fill(password);

  const getSessionResponse = page.waitForResponse(
    (response) => response.url().includes("/api/auth/get-session") && response.status() === 200
  );
  await page.getByTestId("auth.login.form.submit").click();
  await getSessionResponse;

  await page.getByTestId("app.sidebar.user-menu-trigger").click();
  await expect(page.getByTestId("app.sign-out")).toBeVisible();
}

// Skip this test when email verification is disabled (NEXT_PUBLIC_AUTH_DISABLE_SIGNUP defaults to true)
// eslint-disable-next-line playwright/no-skipped-test
test.skip(
  process.env.NEXT_PUBLIC_AUTH_DISABLE_SIGNUP === "true" || process.env.NEXT_PUBLIC_AUTH_DISABLE_SIGNUP === undefined,
  "Skipping test: email verification is disabled"
);

test("sign-up with email verification enabled redirects to check-email page", async ({ page }) => {
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

  // When email verification is enabled, user is redirected to check-email page
  await expect(page.getByTestId("auth.check-email.page")).toBeVisible();
  await completeEmailVerificationFlow(page, signUpUser.email);
  await performLogin(page, signUpUser.email, signUpUser.password);
});

// eslint-disable-next-line playwright/no-skipped-test
test.skip(
  process.env.NEXT_PUBLIC_AUTH_DISABLE_SIGNUP !== "true" && process.env.NEXT_PUBLIC_AUTH_DISABLE_SIGNUP !== undefined,
  "Skipping test: email verification is enabled"
);

test("sign-up with email verification disabled redirects to login page", async ({ page }) => {
  const testUser = {
    email: `e2e-sign-up-disabled-${crypto.randomUUID()}@example.com`,
    password: crypto.randomUUID(),
    name: "E2E User Disabled",
  };

  await page.goto("/auth/sign-up");
  await page.getByTestId("auth.sign-up.form.email").fill(testUser.email);
  await page.getByTestId("auth.sign-up.form.password").fill(testUser.password);
  await page.getByTestId("auth.sign-up.form.confirm-password").fill(testUser.password);
  await page.getByTestId("auth.sign-up.form.name").fill(testUser.name);
  await page.getByTestId("auth.sign-up.form.submit").click();

  // When email verification is disabled, user is redirected to login page
  await expect(page.getByTestId("auth.login.page")).toBeVisible();

  // Complete login flow (no email verification needed)
  await performLogin(page, testUser.email, testUser.password);

  // Cleanup
  await smtpServerApi.deleteMessagesBySearch({ query: `to:"${testUser.email}"` });
});
