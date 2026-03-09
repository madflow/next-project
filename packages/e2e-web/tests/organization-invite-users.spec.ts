import { Page, expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { extractLinkFromMessage, getLatestEmail, loginUser, logoutUser } from "../utils";
import { smtpServerApi } from "../utils";

const orgWithPermission = "Test Organization 3";

async function inviteUser(page: Page, userEmail: string) {
  await page.getByTestId("app.organization-switcher").click();
  // Wait for the invite button to be visible — this implies permissions have loaded
  await expect(page.getByTestId("app.organization-switcher.invite")).toBeVisible();
  await page.getByTestId("app.organization-switcher.invite").click();
  await page.getByTestId("admin.users.invite.form.email").fill(userEmail);
  const inviteResponsePromise = page.waitForResponse("api/auth/organization/invite-member");
  await page.getByTestId("admin.users.invite.form.submit").click();
  await inviteResponsePromise;
  await page.getByTestId("invite-user-modal.close").click();
}

async function tryLoginUser(page: Page, email: string, passwords: string[]) {
  for (const password of passwords) {
    await expect(page.getByTestId("auth.login.form.email")).toBeVisible();
    await page.getByTestId("auth.login.form.email").fill(email);
    await page.getByTestId("auth.login.form.password").fill(password);
    await page.getByTestId("auth.login.form.submit").click();
    try {
      await expect(page.getByTestId("app.sidebar.user-menu-trigger")).toBeVisible({ timeout: 5000 });
      return;
    } catch {
      // Login failed with this password, try the next one
      await page.goto("/auth/login");
    }
  }
  throw new Error(`Unable to log in as ${email} with any known password`);
}

async function selectOrganization(page: Page, orgName: string) {
  const organizationSwitcher = page.getByTestId("app.organization-switcher");
  await organizationSwitcher.click();
  await page.getByText(orgName, { exact: true }).click();
  await expect(organizationSwitcher.locator("span")).toHaveText(orgName);
}

async function visitAcceptPageFromEmail(page: Page, userEmail: string) {
  const message = await getLatestEmail(userEmail);
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
    // The password may have been changed by user-account tests; try both known passwords
    await tryLoginUser(page, testUsers.accountInNoOrg.email, [testUsers.accountInNoOrg.password, "Tester1234567"]);
    await page.goto(acceptUrl);
    await page.getByTestId("auth-accept-invitation-card.accept").click();
    await page.goto("/");
    await selectOrganization(page, orgWithPermission);
  });
});
