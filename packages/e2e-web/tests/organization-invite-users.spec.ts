import { Page, expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { extractLinkFromMessage, loginUser, logoutUser } from "../utils";
import { smtpServerApi } from "../utils";

const orgWithPermission = "Test Organization 3";

async function inviteUser(page: Page, userEmail: string) {
  await page.getByTestId("app.organization-switcher").click();
  await page.getByTestId("app.organization-switcher.invite").click();
  await page.getByTestId("admin.users.invite.form.email").fill(userEmail);
  const inviteResponsePromise = page.waitForResponse("api/auth/organization/invite-member");
  await page.getByTestId("admin.users.invite.form.submit").click();
  await inviteResponsePromise;
  await page.waitForLoadState("networkidle");
  await page.getByTestId("invite-user-modal.close").click();
}

async function selectOrganization(page: Page, orgName: string) {
  const organizationSwitcher = page.getByTestId("app.organization-switcher");
  await organizationSwitcher.click();
  await page.getByText(orgName, { exact: true }).click();
  await expect(organizationSwitcher.locator("span")).toHaveText(orgName);
  await page.waitForTimeout(250);
}

async function visitAcceptPageFromEmail(page: Page, userEmail: string) {
  const searchMessages = await smtpServerApi.searchMessages({
    query: `to:"${userEmail}"`,
  });
  expect(searchMessages.messages.length).toBe(1);
  const message = searchMessages.messages[0];
  const acceptLink = await extractLinkFromMessage(message, "accept-invitation");
  expect(acceptLink).toBeTruthy();
  await smtpServerApi.deleteMessagesBySearch({ query: `to:"${userEmail}"` });
  await page.goto(acceptLink);
}

test.describe.configure({ mode: "parallel" });
test.describe("User invitations", () => {
  test("an owner can invite a not existing user", async ({ page }) => {
    const userEmail = `e2e-test-user-not-registered-${Date.now()}@example.com`;
    await page.goto("/");
    await loginUser(page, testUsers.accountMultipleOrgs.email, testUsers.accountMultipleOrgs.password);
    await selectOrganization(page, orgWithPermission);
    await inviteUser(page, userEmail);
    await logoutUser(page);
    await visitAcceptPageFromEmail(page, userEmail);

    await page.getByTestId("auth.sign-up.form.name").fill("E2E Tester");
    await page.getByTestId("auth.sign-up.form.password").fill("Tester12345");
    await page.getByTestId("auth.sign-up.form.confirm-password").fill("Tester12345");
    await page.getByTestId("auth.sign-up.form.submit").click();

    await expect(page.getByTestId("auth.login.page")).toBeVisible();

    const searchMessagesVerify = await smtpServerApi.searchMessages({
      query: `to:"${userEmail}"`,
    });

    const messagesVerify = searchMessagesVerify.messages[0];
    const verifyLink = await extractLinkFromMessage(messagesVerify, "verify-email");

    await page.goto(verifyLink);
    await loginUser(page, userEmail, "Tester12345");
  });

  test("an owner can invite an existing user", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.accountMultipleOrgs.email, testUsers.accountMultipleOrgs.password);
    await selectOrganization(page, orgWithPermission);
    await inviteUser(page, testUsers.accountInNoOrg.email);
    await logoutUser(page);

    await visitAcceptPageFromEmail(page, testUsers.accountInNoOrg.email);
    await expect(page.getByTestId("auth-accept-invitation-card-not-signed-in")).toBeVisible();
    const acceptUrl = "" + page.url();
    await page.goto("/auth/login");
    await loginUser(page, testUsers.accountInNoOrg.email, testUsers.accountInNoOrg.password);
    await page.goto(acceptUrl);
    await page.getByTestId("auth-accept-invitation-card.accept").click();
    await page.goto("/");
    await selectOrganization(page, orgWithPermission);
  });
});
