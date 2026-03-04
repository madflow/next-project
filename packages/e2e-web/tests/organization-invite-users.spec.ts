import { Page, expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { extractLinkFromMessage, loginUser, logoutUser } from "../utils";
import { smtpServerApi } from "../utils";

const orgWithPermission = "Test Organization 3";

async function inviteUser(page: Page, userEmail: string) {
  // /api/auth/organization/get-full-organization
  const getOrgResponsePromise = page.waitForResponse("api/auth/organization/get-full-organization");
  await page.getByTestId("app.organization-switcher").click();
  await getOrgResponsePromise;
  await page.getByTestId("app.organization-switcher.invite").click();
  await page.getByTestId("admin.users.invite.form.email").fill(userEmail);
  const inviteResponsePromise = page.waitForResponse("api/auth/organization/invite-member");
  await page.getByTestId("admin.users.invite.form.submit").click();
  await inviteResponsePromise;
  await page.getByTestId("invite-user-modal.close").click();
}

async function selectOrganization(page: Page, orgName: string) {
  const organizationSwitcher = page.getByTestId("app.organization-switcher");
  await organizationSwitcher.click();
  await page.getByText(orgName, { exact: true }).click();
  await expect(organizationSwitcher.locator("span")).toHaveText(orgName);
}

async function visitAcceptPageFromEmail(page: Page, userEmail: string) {
  const searchMessages = await smtpServerApi.searchMessages({
    query: `to:"${userEmail}"`,
  });
  expect(searchMessages.messages).toHaveLength(1);
  const message = searchMessages.messages[0];
  const acceptLink = await extractLinkFromMessage(message, "accept-invitation");
  expect(acceptLink).toBeTruthy();
  await smtpServerApi.deleteMessagesBySearch({ query: `to:"${userEmail}"` });
  await page.goto(acceptLink);
}

test.describe.configure({ mode: "parallel" });

test.describe("User invitations", () => {
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
