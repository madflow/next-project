import { Page, expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { extractLinkFromMessage, loginUser, logoutUser, smtpServerApi } from "../utils";

async function switchLocale(page: Page, language: "German" | "Englisch") {
  await page.getByTestId("app.locale-switcher").click();
  await page.getByRole("option", { name: language }).click();
}

async function getLatestEmail(email: string) {
  const searchMessages = await smtpServerApi.searchMessages({
    query: `to:"${email}"`,
  });
  expect(searchMessages.messages.length).toBeGreaterThan(0);
  return searchMessages.messages[0];
}

test.describe.configure({ mode: "parallel" });
test.describe("Email Translations", () => {
  test("email verification email should be sent in English when locale is English", async ({ page }) => {
    const userEmail = `e2e-email-verify-en-${Date.now()}@example.com`;
    const password = crypto.randomUUID();

    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.goto("/auth/sign-up");
    await page.getByTestId("auth.sign-up.form.email").fill(userEmail);
    await page.getByTestId("auth.sign-up.form.password").fill(password);
    await page.getByTestId("auth.sign-up.form.confirm-password").fill(password);
    await page.getByTestId("auth.sign-up.form.name").fill("E2E User EN");
    await page.getByTestId("auth.sign-up.form.submit").click();


    const message = await getLatestEmail(userEmail);
    expect(message.Subject).toBe("Email Verification");

    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${userEmail}"` });
  });

  test("email verification email should be sent in German when locale is German", async ({ page }) => {
    const userEmail = `e2e-email-verify-de-${Date.now()}@example.com`;
    const password = crypto.randomUUID();

    await page.goto("/");

    await switchLocale(page, "German");
    await expect(page.locator("html")).toHaveAttribute("lang", "de");

    await page.goto("/auth/sign-up");
    await page.getByTestId("auth.sign-up.form.email").fill(userEmail);
    await page.getByTestId("auth.sign-up.form.password").fill(password);
    await page.getByTestId("auth.sign-up.form.confirm-password").fill(password);
    await page.getByTestId("auth.sign-up.form.name").fill("E2E User DE");
    await page.getByTestId("auth.sign-up.form.submit").click();


    const message = await getLatestEmail(userEmail);
    expect(message.Subject).toBe("E-Mail-Verifizierung");

    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${userEmail}"` });
  });

  test("password reset email should be sent in English when locale is English", async ({ page }) => {
    const userEmail = testUsers.regularUser.email;

    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.goto("/auth/forgot-password");
    await page.getByTestId("auth.forgot-password.form.email").fill(userEmail);
    await page.getByTestId("auth.forgot-password.form.submit").click();


    const message = await getLatestEmail(userEmail);
    expect(message.Subject).toBe("Reset your password");

    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${userEmail}"` });
  });

  test("password reset email should be sent in German when locale is German", async ({ page }) => {
    const userEmail = testUsers.regularUser.email;

    await page.goto("/");

    await switchLocale(page, "German");
    await expect(page.locator("html")).toHaveAttribute("lang", "de");

    await page.goto("/auth/forgot-password");
    await page.getByTestId("auth.forgot-password.form.email").fill(userEmail);
    await page.getByTestId("auth.forgot-password.form.submit").click();


    const message = await getLatestEmail(userEmail);
    expect(message.Subject).toBe("Passwort zurücksetzen");

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
    await page.getByTestId("app.user.account.email.update").click();

    const message = await getLatestEmail(userEmail);
    expect(message.Subject).toBe("Confirm your new email address");

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
    expect(message.Subject).toBe("Bestätigen Sie Ihre neue E-Mail-Adresse");

    const verifyLink = await extractLinkFromMessage(message, "verify-email");
    expect(verifyLink).toBeTruthy();

    await logoutUser(page);
    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${userEmail}"` });
    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${newEmail}"` });
  });

  test("organization invite email should be sent in English when inviter locale is English", async ({ page }) => {
    const newUserEmail = `e2e-invite-en-${Date.now()}@example.com`;
    const inviterEmail = testUsers.accountMultipleOrgs.email;
    const orgName = "Test Organization 3";

    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await loginUser(page, inviterEmail, testUsers.accountMultipleOrgs.password);

    await page.getByTestId("app.organization-switcher").click();
    await page.getByText(orgName, { exact: true }).click();

    await page.getByTestId("app.organization-switcher").click();
    const inviteButton = page.getByTestId("app.organization-switcher.invite");
    await inviteButton.waitFor({ state: "visible", timeout: 5000 });
    await inviteButton.click();
    await page.getByTestId("admin.users.invite.form.email").fill(newUserEmail);
    const inviteResponsePromise = page.waitForResponse("api/auth/organization/invite-member");
    await page.getByTestId("admin.users.invite.form.submit").click();
    await inviteResponsePromise;
    await page.getByTestId("invite-user-modal.close").click();

    const message = await getLatestEmail(newUserEmail);
    expect(message.Subject).toBe("You have been invited");

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

    await page.getByTestId("app.organization-switcher").click();
    await page.getByText(orgName, { exact: true }).click();

    await page.getByTestId("app.organization-switcher").click();
    const inviteButton = page.getByTestId("app.organization-switcher.invite");
    await inviteButton.waitFor({ state: "visible", timeout: 5000 });
    await inviteButton.click();
    await page.getByTestId("admin.users.invite.form.email").fill(newUserEmail);
    const inviteResponsePromise = page.waitForResponse("api/auth/organization/invite-member");
    await page.getByTestId("admin.users.invite.form.submit").click();
    await inviteResponsePromise;
    await page.getByTestId("invite-user-modal.close").click();

    const message = await getLatestEmail(newUserEmail);
    expect(message.Subject).toBe("Sie wurden eingeladen");

    await logoutUser(page);
    await smtpServerApi.deleteMessagesBySearch({ query: `to:"${newUserEmail}"` });
  });
});
