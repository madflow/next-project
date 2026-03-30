import { Page, expect, test } from "@playwright/test";
import { testUsers } from "../config";
import {
  extractLinkFromMessage,
  getLatestEmail,
  inviteUser,
  loginUser,
  logoutUser,
  selectOrganization,
  smtpServerApi,
} from "../utils";

async function switchLocale(page: Page, language: "German" | "Englisch") {
  await page.getByTestId("app.locale-switcher").click();
  await page.getByRole("option", { name: language }).click();
}

test.describe("Email Translations", () => {
  test.afterAll(async () => {
    await smtpServerApi.deleteMessages();
  });

  test("password reset email should be sent in English when locale is English", async ({ page }) => {
    const userEmail = testUsers.regularUser.email;

    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.goto("/auth/forgot-password");
    await page.getByTestId("auth.forgot-password.form.email").fill(userEmail);
    const resetResponsePromise = page.waitForResponse("api/auth/request-password-reset");
    await page.getByTestId("auth.forgot-password.form.submit").click();
    await resetResponsePromise;

    const message = await getLatestEmail(userEmail);
    expect(message?.Subject).toBe("Reset your password");

    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${userEmail}"` });
  });

  test("password reset email should be sent in German when locale is German", async ({ page }) => {
    const userEmail = testUsers.regularUser.email;

    await page.goto("/");

    await switchLocale(page, "German");
    await expect(page.locator("html")).toHaveAttribute("lang", "de");

    await page.goto("/auth/forgot-password");
    await page.getByTestId("auth.forgot-password.form.email").fill(userEmail);

    const resetResponsePromise = page.waitForResponse("api/auth/request-password-reset");
    await page.getByTestId("auth.forgot-password.form.submit").click();
    await resetResponsePromise;

    const message = await getLatestEmail(userEmail);
    expect(message?.Subject).toBe("Passwort zurücksetzen");

    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${userEmail}"` });
  });

  test("email change email should be sent in English when locale is English", async ({ page }) => {
    const userEmail = testUsers.emailChanger.email;
    const newEmail = `e2e-email-change-en-${Date.now()}@example.com`;

    await page.goto("/");
    await loginUser(page, userEmail, testUsers.emailChanger.password);

    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.goto("/user/account");
    await page.waitForURL(/\/user\/account/);
    await page.getByTestId("app.user.account.email").fill(newEmail);
    const changeEmailResponsePromise = page.waitForResponse("api/auth/change-email");
    await page.getByTestId("app.user.account.email.update").click();
    await changeEmailResponsePromise;

    const message = await getLatestEmail(userEmail);

    expect(message?.Subject).toBe("Confirm your new email address");

    const verifyLink = await extractLinkFromMessage(message, "verify-email");
    expect(verifyLink).toBeTruthy();

    await logoutUser(page);
    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${userEmail}"` });
    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${newEmail}"` });
  });

  test("email change email should be sent in German when locale is German", async ({ page }) => {
    const userEmail = testUsers.emailChanger.email;
    const newEmail = `e2e-email-change-de-${Date.now()}@example.com`;

    await page.goto("/");
    await switchLocale(page, "German");
    await loginUser(page, userEmail, testUsers.emailChanger.password);

    await expect(page.locator("html")).toHaveAttribute("lang", "de");

    await page.goto("/user/account");
    await page.waitForURL(/\/user\/account/);
    await page.getByTestId("app.user.account.email").fill(newEmail);
    await page.getByTestId("app.user.account.email.update").click();

    const message = await getLatestEmail(userEmail);
    expect(message?.Subject).toBe("Bestätigen Sie Ihre neue E-Mail-Adresse");

    const verifyLink = await extractLinkFromMessage(message, "verify-email");
    expect(verifyLink).toBeTruthy();

    await logoutUser(page);
    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${userEmail}"` });
    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${newEmail}"` });
  });

  test("organization invite email should be sent in English when inviter locale is English", async ({ context }) => {
    const newUserEmail = `e2e-invite-en-${Date.now()}@example.com`;
    const inviterEmail = testUsers.accountMultipleOrgs.email;
    const orgName = "Test Organization 3";

    const page = await context.newPage();

    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await loginUser(page, inviterEmail, testUsers.accountMultipleOrgs.password);

    await selectOrganization(page, orgName);
    await inviteUser(page, newUserEmail);

    const message = await getLatestEmail(newUserEmail);
    expect(message?.Subject).toBe("Invitation to join Next project");

    await logoutUser(page);
    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${newUserEmail}"` });
  });

  test("organization invite email should be sent in German when inviter locale is German", async ({ page }) => {
    const newUserEmail = `e2e-invite-de-${Date.now()}@example.com`;
    const inviterEmail = testUsers.accountMultipleOrgs.email;
    const orgName = "Test Organization 3";

    await page.goto("/");

    await switchLocale(page, "German");
    await expect(page.locator("html")).toHaveAttribute("lang", "de");

    await loginUser(page, inviterEmail, testUsers.accountMultipleOrgs.password);

    await selectOrganization(page, orgName);
    await inviteUser(page, newUserEmail);

    const message = await getLatestEmail(newUserEmail);
    expect(message?.Subject).toBe("Einladung zum Beitritt zu Next project");

    await logoutUser(page);
    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${newUserEmail}"` });
  });
});
