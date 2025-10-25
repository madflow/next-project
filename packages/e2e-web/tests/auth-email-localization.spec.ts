import { expect, test } from "@playwright/test";
import { smtpServerApi, loginUser, logoutUser } from "../utils";

test.describe("Email Localization", () => {
  test("password reset email uses user locale (German)", async ({ page }) => {
    const testUser = {
      email: `e2e-pwd-reset-de-${crypto.randomUUID()}@example.com`,
      password: crypto.randomUUID(),
      name: "E2E German User",
    };

    await page.goto("/auth/sign-up");
    await page.getByTestId("auth.sign-up.form.email").fill(testUser.email);
    await page.getByTestId("auth.sign-up.form.password").fill(testUser.password);
    await page.getByTestId("auth.sign-up.form.confirm-password").fill(testUser.password);
    await page.getByTestId("auth.sign-up.form.name").fill(testUser.name);
    await page.getByTestId("auth.sign-up.form.submit").click();

    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${testUser.email}"` });

    await page.goto("/de/auth/forgot-password");
    await page.getByTestId("auth.forgot-password.form.email").fill(testUser.email);
    await page.getByTestId("auth.forgot-password.form.submit").click();

    await page.waitForTimeout(1000);

    const searchMessages = await smtpServerApi.searchMessages({
      query: `to:"${testUser.email}"`,
    });

    expect(searchMessages.messages.length).toBeGreaterThan(0);
    const message = searchMessages.messages[0];

    expect(message.Subject).toBe("Passwort zurücksetzen");

    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${testUser.email}"` });
  });

  test("password reset email uses user locale (English)", async ({ page }) => {
    const testUser = {
      email: `e2e-pwd-reset-en-${crypto.randomUUID()}@example.com`,
      password: crypto.randomUUID(),
      name: "E2E English User",
    };

    await page.goto("/auth/sign-up");
    await page.getByTestId("auth.sign-up.form.email").fill(testUser.email);
    await page.getByTestId("auth.sign-up.form.password").fill(testUser.password);
    await page.getByTestId("auth.sign-up.form.confirm-password").fill(testUser.password);
    await page.getByTestId("auth.sign-up.form.name").fill(testUser.name);
    await page.getByTestId("auth.sign-up.form.submit").click();

    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${testUser.email}"` });

    await page.goto("/auth/forgot-password");
    await page.getByTestId("auth.forgot-password.form.email").fill(testUser.email);
    await page.getByTestId("auth.forgot-password.form.submit").click();

    await page.waitForTimeout(1000);

    const searchMessages = await smtpServerApi.searchMessages({
      query: `to:"${testUser.email}"`,
    });

    expect(searchMessages.messages.length).toBeGreaterThan(0);
    const message = searchMessages.messages[0];

    expect(message.Subject).toBe("Reset your password");

    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${testUser.email}"` });
  });

  test("email verification uses user locale (German)", async ({ page }) => {
    const testUser = {
      email: `e2e-verify-de-${crypto.randomUUID()}@example.com`,
      password: crypto.randomUUID(),
      name: "E2E German Verify User",
    };

    await page.goto("/de/auth/sign-up");
    await page.getByTestId("auth.sign-up.form.email").fill(testUser.email);
    await page.getByTestId("auth.sign-up.form.password").fill(testUser.password);
    await page.getByTestId("auth.sign-up.form.confirm-password").fill(testUser.password);
    await page.getByTestId("auth.sign-up.form.name").fill(testUser.name);
    await page.getByTestId("auth.sign-up.form.submit").click();

    await page.waitForTimeout(1000);

    const searchMessages = await smtpServerApi.searchMessages({
      query: `to:"${testUser.email}"`,
    });

    expect(searchMessages.messages.length).toBeGreaterThan(0);
    const message = searchMessages.messages[0];

    expect(message.Subject).toBe("E-Mail-Verifizierung");

    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${testUser.email}"` });
  });

  test("email verification uses user locale (English)", async ({ page }) => {
    const testUser = {
      email: `e2e-verify-en-${crypto.randomUUID()}@example.com`,
      password: crypto.randomUUID(),
      name: "E2E English Verify User",
    };

    await page.goto("/auth/sign-up");
    await page.getByTestId("auth.sign-up.form.email").fill(testUser.email);
    await page.getByTestId("auth.sign-up.form.password").fill(testUser.password);
    await page.getByTestId("auth.sign-up.form.confirm-password").fill(testUser.password);
    await page.getByTestId("auth.sign-up.form.name").fill(testUser.name);
    await page.getByTestId("auth.sign-up.form.submit").click();

    await page.waitForTimeout(1000);

    const searchMessages = await smtpServerApi.searchMessages({
      query: `to:"${testUser.email}"`,
    });

    expect(searchMessages.messages.length).toBeGreaterThan(0);
    const message = searchMessages.messages[0];

    expect(message.Subject).toBe("Email Verification");

    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${testUser.email}"` });
  });

  test("email change uses user locale", async ({ page }) => {
    const testUser = {
      email: `e2e-change-${crypto.randomUUID()}@example.com`,
      newEmail: `e2e-new-${crypto.randomUUID()}@example.com`,
      password: crypto.randomUUID(),
      name: "E2E Change Email User",
    };

    await page.goto("/de/auth/sign-up");
    await page.getByTestId("auth.sign-up.form.email").fill(testUser.email);
    await page.getByTestId("auth.sign-up.form.password").fill(testUser.password);
    await page.getByTestId("auth.sign-up.form.confirm-password").fill(testUser.password);
    await page.getByTestId("auth.sign-up.form.name").fill(testUser.name);
    await page.getByTestId("auth.sign-up.form.submit").click();

    await page.waitForTimeout(1000);

    let searchMessages = await smtpServerApi.searchMessages({
      query: `to:"${testUser.email}"`,
    });
    const verificationMessage = searchMessages.messages[0];
    const linkCheck = await smtpServerApi.linkCheck(verificationMessage.ID);
    let verifyLink = "";
    for (const link of linkCheck.Links) {
      if (link.URL.includes("verify-email")) {
        verifyLink = link.URL;
      }
    }
    await page.goto(verifyLink);

    await loginUser(page, testUser.email, testUser.password);

    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${testUser.email}"` });

    await page.goto("/de/settings/account");
    await page.getByTestId("settings.account.email.change").click();
    await page.getByTestId("settings.account.email.new-email").fill(testUser.newEmail);
    await page.getByTestId("settings.account.email.submit").click();

    await page.waitForTimeout(1000);

    searchMessages = await smtpServerApi.searchMessages({
      query: `to:"${testUser.email}"`,
    });

    expect(searchMessages.messages.length).toBeGreaterThan(0);
    const message = searchMessages.messages[0];

    expect(message.Subject).toBe("Bestätigen Sie Ihre neue E-Mail-Adresse");

    await logoutUser(page);
    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${testUser.email}"` });
    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${testUser.newEmail}"` });
  });

  test("fallback to English for unsupported locale", async ({ page }) => {
    const testUser = {
      email: `e2e-fallback-${crypto.randomUUID()}@example.com`,
      password: crypto.randomUUID(),
      name: "E2E Fallback User",
    };

    await page.goto("/fr/auth/sign-up");
    await page.getByTestId("auth.sign-up.form.email").fill(testUser.email);
    await page.getByTestId("auth.sign-up.form.password").fill(testUser.password);
    await page.getByTestId("auth.sign-up.form.confirm-password").fill(testUser.password);
    await page.getByTestId("auth.sign-up.form.name").fill(testUser.name);
    await page.getByTestId("auth.sign-up.form.submit").click();

    await page.waitForTimeout(1000);

    const searchMessages = await smtpServerApi.searchMessages({
      query: `to:"${testUser.email}"`,
    });

    expect(searchMessages.messages.length).toBeGreaterThan(0);
    const message = searchMessages.messages[0];

    expect(message.Subject).toBe("Email Verification");

    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${testUser.email}"` });
  });
});
