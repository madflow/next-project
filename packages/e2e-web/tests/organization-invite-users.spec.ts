import { Page, expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { extractLinkFromMessage, getLatestEmail, loginUser, logoutUser } from "../utils";
import { smtpServerApi } from "../utils";

const orgWithPermission = "Test Organization 3";

async function inviteUser(page: Page, userEmail: string) {
  // The invite button only renders once canCreateInvitations resolves.
  // The dropdown may close or re-render while permissions load, so we retry the
  // entire open-and-click sequence until it succeeds.
  const inviteButton = page.getByTestId("app.organization-switcher.invite");
  const switcher = page.getByTestId("app.organization-switcher");
  await expect(async () => {
    // Re-open the dropdown if it's not showing the invite button
    if (!(await inviteButton.isVisible())) {
      await switcher.click();
    }
    // Click the invite button; this will throw if element is not stable or detaches
    await inviteButton.click({ timeout: 2000 });
  }).toPass({ timeout: 15000 });

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
  // Scope the click to within the dropdown menu to avoid matching org name text
  // elsewhere on the page (e.g. page headings, breadcrumbs, project lists).
  const menu = page.getByTestId("app.organization-switcher.menu");
  await expect(menu).toBeVisible();
  await menu.getByText(orgName, { exact: true }).click();
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
