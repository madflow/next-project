import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Admin Projects", () => {
  test.describe.configure({ mode: "parallel" });

  test("list projects", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/projects");
    await expect(page.getByTestId("admin.projects.page")).toBeVisible();
  });

  test("create and edit project", async ({ page }) => {
    const projectName = `Test Project ${Date.now()}`;
    const projectSlug = `test-project-${Date.now()}`;

    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/projects/new");

    // Fill in the form
    await page.getByTestId("admin.projects.new.form.name").click();
    await page.getByTestId("admin.projects.new.form.name").fill(projectName);
    await page.getByTestId("admin.projects.new.form.name").press("Tab");
    await page.getByTestId("admin.projects.new.form.slug").fill(projectSlug);
    await page.getByRole("combobox", { name: "Organization" }).click();
    await page.getByTestId("org-option-test-organization-2").getByText("Test Organization 2").click();

    // Submit the form
    const createResponse = page.waitForResponse(
      (response) => response.url().includes("/admin/projects") && response.request().method() === "POST"
    );
    await page.getByTestId("admin.projects.new.form.submit").click();
    await createResponse;

    // Verify project was created
    await expect(page.getByTestId("admin.projects.page")).toBeVisible();
    await expect(page.getByText(projectName)).toBeVisible();

    // Edit the project using the slug in the test ID
    await page.getByTestId(`admin.projects.list.edit-${projectSlug}`).click();

    // Update project details
    const updatedName = `Updated ${projectName}`;
    const updatedSlug = `updated-${projectSlug}`;

    await page.getByTestId("admin.projects.edit.form.name").fill(updatedName);
    await page.getByTestId("admin.projects.edit.form.slug").fill(updatedSlug);

    // Submit the update form
    await page.getByTestId("admin.projects.edit.form.submit").click();

    // Verify the updated project is in the list
    await expect(page.getByTestId("admin.projects.page")).toBeVisible();
    await expect(page.getByText(updatedName)).toBeVisible();
  });
});
