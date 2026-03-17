import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { inviteUser, loginUser, logoutUser, selectOrganization, visitAcceptPageFromEmail } from "../utils";

const orgWithPermission = "Test Organization 3";

test.describe("User invitations", () => {
  test("an owner can invite an existing user", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.accountMultipleOrgs.email, testUsers.accountMultipleOrgs.password);
    await selectOrganization(page, orgWithPermission);
    await inviteUser(page, testUsers.inviteTarget.email);
    await logoutUser(page);

    await visitAcceptPageFromEmail(page, testUsers.inviteTarget.email);
    await expect(page.getByTestId("auth-accept-invitation-card-not-signed-in")).toBeVisible();
    const acceptUrl = "" + page.url();
    await page.goto("/auth/login");
    await loginUser(page, testUsers.inviteTarget.email, testUsers.inviteTarget.password);
    await page.goto(acceptUrl);
    await page.getByTestId("auth-accept-invitation-card.accept").click();
    await page.goto("/");
    await selectOrganization(page, orgWithPermission);
  });
});
