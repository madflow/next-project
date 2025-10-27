import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Landing page auto-redirect", () => {
  test("should redirect user with single org and single project to project landing page", async ({ page }) => {
    // user@example.com has:
    // - 1 organization: test-organization
    // - 1 project in that organization: test-project
    // Therefore, they should be auto-redirected to /project/test-project

    await page.goto("/");
    await loginUser(page, testUsers.regularUser.email, testUsers.regularUser.password);

    // After login, user should be redirected to /landing
    // Then immediately redirected to /project/test-project (the single project)
    await page.waitForURL("/project/test-project");

    // Verify we're on the project landing page
    await expect(page).toHaveURL("/project/test-project");
    await expect(page.getByTestId("app.project.landing")).toBeVisible();
  });

  test("should NOT redirect user with multiple organizations to project page", async ({ page }) => {
    // accountmultipleorgs@example.com has:
    // - 3 organizations
    // - Multiple projects across those organizations
    // Therefore, they should stay on the landing page

    await page.goto("/");
    await loginUser(page, testUsers.accountMultipleOrgs.email, testUsers.accountMultipleOrgs.password);

    // After login, user should be redirected to /landing and stay there
    await expect(page).toHaveURL("/landing");
    await expect(page.getByTestId("app.landing.page")).toBeVisible();
  });

  test("should NOT redirect user with no organizations to project page", async ({ page }) => {
    // account-in-no-org@example.com has:
    // - 0 organizations
    // - 0 projects
    // Therefore, they should stay on the landing page

    await page.goto("/");
    await loginUser(page, testUsers.accountInNoOrg.email, testUsers.accountInNoOrg.password);

    // After login, user should be redirected to /landing and stay there
    await expect(page).toHaveURL("/landing");
    await expect(page.getByTestId("app.landing.page")).toBeVisible();
  });

  test("should redirect admin with no org memberships to landing (admins see all projects)", async ({ page }) => {
    // admin-in-no-org@example.com has:
    // - role: admin (can see all organizations and projects)
    // - 0 organization memberships
    // But as admin, they see ALL projects (multiple), so should NOT redirect

    await page.goto("/");
    await loginUser(page, testUsers.adminInNoOrg.email, testUsers.adminInNoOrg.password);

    // After login, admin should be redirected to /landing and stay there
    // (because they see multiple projects as admin)
    await expect(page).toHaveURL("/landing");
    await expect(page.getByTestId("app.landing.page")).toBeVisible();
  });
});
