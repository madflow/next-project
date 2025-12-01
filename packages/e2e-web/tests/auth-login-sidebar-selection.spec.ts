import { expect, test } from "@playwright/test";
import { testUsers } from "../config";

test.describe("Auth - Login Sidebar Selection", () => {
  test("regular user should see selected organization and project immediately after first login", async ({
    page,
    context,
  }) => {
    // Clear browser state to simulate first-time login
    await context.clearCookies();

    // Navigate to login page
    await page.goto("/");

    // Verify we're on the login page
    await expect(page.getByTestId("auth.login.page")).toBeVisible();

    // Fill in login credentials
    await page.getByTestId("auth.login.form.email").fill(testUsers.regularUser.email);
    await page.getByTestId("auth.login.form.password").fill(testUsers.regularUser.password);

    // Submit login
    await page.getByTestId("auth.login.form.submit").click();

    // Assert: User is redirected to the project adhoc page
    await expect(page).toHaveURL("/project/test-project/adhoc");

    // Assert: Organization switcher shows "Test Organization" immediately
    const orgSwitcher = page.getByTestId("app.organization-switcher");
    await expect(orgSwitcher).toBeVisible();
    await expect(orgSwitcher.locator("span")).toHaveText("Test Organization");

    // Assert: Project switcher shows "Test Project" immediately
    const projectSwitcher = page.getByTestId("app.project-switcher");
    await expect(projectSwitcher).toBeVisible();
    await expect(projectSwitcher.locator("span")).toHaveText("Test Project");

    // Assert: User menu is visible (confirms fully logged in)
    await expect(page.getByTestId("app.sidebar.user-menu-trigger")).toBeVisible();
  });

  test("admin user should see selected organization and project immediately after first login", async ({
    page,
    context,
  }) => {
    // Clear browser state to simulate first-time login
    await context.clearCookies();

    // Navigate to login page
    await page.goto("/");

    // Verify we're on the login page
    await expect(page.getByTestId("auth.login.page")).toBeVisible();

    // Fill in login credentials
    await page.getByTestId("auth.login.form.email").fill(testUsers.admin.email);
    await page.getByTestId("auth.login.form.password").fill(testUsers.admin.password);

    // Submit login
    await page.getByTestId("auth.login.form.submit").click();

    // Assert: User is redirected to the project adhoc page
    await expect(page).toHaveURL("/project/test-project/adhoc");

    // Assert: Organization switcher shows "Test Organization" immediately
    const orgSwitcher = page.getByTestId("app.organization-switcher");
    await expect(orgSwitcher).toBeVisible();
    await expect(orgSwitcher.locator("span")).toHaveText("Test Organization");

    // Assert: Project switcher shows "Test Project" immediately
    const projectSwitcher = page.getByTestId("app.project-switcher");
    await expect(projectSwitcher).toBeVisible();
    await expect(projectSwitcher.locator("span")).toHaveText("Test Project");

    // Assert: User menu is visible (confirms fully logged in)
    await expect(page.getByTestId("app.sidebar.user-menu-trigger")).toBeVisible();
  });

  test("regular user: organization and project remain selected after hard reload", async ({ page, context }) => {
    // Clear browser state
    await context.clearCookies();

    // Login
    await page.goto("/");
    await page.getByTestId("auth.login.form.email").fill(testUsers.regularUser.email);
    await page.getByTestId("auth.login.form.password").fill(testUsers.regularUser.password);
    await page.getByTestId("auth.login.form.submit").click();

    // Verify initial state
    await expect(page).toHaveURL("/project/test-project/adhoc");
    await expect(page.getByTestId("app.organization-switcher").locator("span")).toHaveText("Test Organization");
    await expect(page.getByTestId("app.project-switcher").locator("span")).toHaveText("Test Project");

    // Hard reload the page
    await page.reload();

    // Assert: Still on the same page
    await expect(page).toHaveURL("/project/test-project/adhoc");

    // Assert: Organization and project are still selected
    await expect(page.getByTestId("app.organization-switcher").locator("span")).toHaveText("Test Organization");
    await expect(page.getByTestId("app.project-switcher").locator("span")).toHaveText("Test Project");

    // Assert: User is still logged in
    await expect(page.getByTestId("app.sidebar.user-menu-trigger")).toBeVisible();
  });

  test("admin user: organization and project remain selected after hard reload", async ({ page, context }) => {
    // Clear browser state
    await context.clearCookies();

    // Login
    await page.goto("/");
    await page.getByTestId("auth.login.form.email").fill(testUsers.admin.email);
    await page.getByTestId("auth.login.form.password").fill(testUsers.admin.password);
    await page.getByTestId("auth.login.form.submit").click();

    // Verify initial state
    await expect(page).toHaveURL("/project/test-project/adhoc");
    await expect(page.getByTestId("app.organization-switcher").locator("span")).toHaveText("Test Organization");
    await expect(page.getByTestId("app.project-switcher").locator("span")).toHaveText("Test Project");

    // Hard reload the page
    await page.reload();

    // Assert: Still on the same page
    await expect(page).toHaveURL("/project/test-project/adhoc");

    // Assert: Organization and project are still selected
    await expect(page.getByTestId("app.organization-switcher").locator("span")).toHaveText("Test Organization");
    await expect(page.getByTestId("app.project-switcher").locator("span")).toHaveText("Test Project");

    // Assert: User is still logged in
    await expect(page.getByTestId("app.sidebar.user-menu-trigger")).toBeVisible();
  });
});
