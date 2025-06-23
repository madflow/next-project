import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Organization members", () => {
  test("user with one org can select organization and project", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.regularUser.email, testUsers.regularUser.password);
    await page.getByTestId("app.organization-switcher").click();
    await page.getByText("Test Organization").click();
    await page.getByTestId("app.project-switcher").click();
    await page.getByText("Test Project").click();
    await expect(page.getByTestId("app.organization-switcher").locator("span")).toContainText("Test Organization");
    await expect(page.getByTestId("app.project-switcher").locator("span")).toContainText("Test Project");
    await page.reload();
    await expect(page.getByTestId("app.organization-switcher").locator("span")).toContainText("Test Organization");
    await expect(page.getByTestId("app.project-switcher").locator("span")).toContainText("Test Project");
  });
  test("admin can select organization and project", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.getByTestId("app.organization-switcher").click();
    await page.getByText("Test Organization").click();
    await page.getByTestId("app.project-switcher").click();
    await page.getByText("Test Project").click();
    await expect(page.getByTestId("app.organization-switcher").locator("span")).toContainText("Test Organization");
    await expect(page.getByTestId("app.project-switcher").locator("span")).toContainText("Test Project");
    await page.reload();
    await expect(page.getByTestId("app.organization-switcher").locator("span")).toContainText("Test Organization");
    await expect(page.getByTestId("app.project-switcher").locator("span")).toContainText("Test Project");
  });
  test("user with multiple orgs can select organization and project", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.accountMultipleOrgs.email, testUsers.accountMultipleOrgs.password);
    await page.getByTestId("app.organization-switcher").click();
    await page.getByText("Test Organization 2", { exact: true }).click();
    await page.getByTestId("app.project-switcher").click();
    await page.getByText("Test Project 2", { exact: true }).click();
    await expect(page.getByTestId("app.organization-switcher").locator("span")).toHaveText("Test Organization 2");
    await expect(page.getByTestId("app.project-switcher").locator("span")).toHaveText("Test Project 2");
    await page.reload();
    await expect(page.getByTestId("app.organization-switcher").locator("span")).toHaveText("Test Organization 2");
    await expect(page.getByTestId("app.project-switcher").locator("span")).toHaveText("Test Project 2");
    await page.waitForLoadState("networkidle");

    const projectsResponsePromise = page.waitForResponse(/projects/);
    await page.getByTestId("app.organization-switcher").click();
    await page.getByText("Test Organization 3", { exact: true }).click();
    await projectsResponsePromise;
    await page.getByTestId("app.project-switcher").click();
    await page.getByText("Test Project 4", { exact: true }).click();
    await expect(page.getByTestId("app.organization-switcher").locator("span")).toHaveText("Test Organization 3");
    await expect(page.getByTestId("app.project-switcher").locator("span")).toHaveText("Test Project 4");
    await page.reload();
    await expect(page.getByTestId("app.organization-switcher").locator("span")).toHaveText("Test Organization 3");
    await expect(page.getByTestId("app.project-switcher").locator("span")).toHaveText("Test Project 4");
  });
});
