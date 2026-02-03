import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Admin Datasets", () => {
  test("should upload a dataset successfully and assign to project", async ({ page }) => {
    const datasetName = `Test Dataset ${Date.now().toLocaleString()}`;
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();
    await page.getByTestId("admin.datasets.create.upload").click();
    const uploadFile = page.getByTestId("file-upload-input");
    await uploadFile.setInputFiles("testdata/spss/demo.sav");
    await page.getByTestId("app.admin.dataset.selected-file").waitFor({ timeout: 5000 });
    await page.getByTestId("app.admin.dataset.name-input").fill(datasetName);
    await page.getByTestId("app.admin.dataset.organization-trigger").click();
    await page.getByTestId("org-option-test-organization").click();
    await page.getByTestId("app.admin.dataset.upload-button").click();
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();
    await page.getByTestId("app.datatable.search-input").fill(datasetName);
    await page.getByRole("link", { name: datasetName }).click();
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();
    await page.getByRole("button", { name: /save changes|änderungen speichern/i }).click();
    await page.getByTestId("app.admin.editor.projects.tab").click();
    await page.getByTestId("project-dropdown").click();
    await page.getByTestId("project-dropdown-item-test-project").getByText("Test Project").click();
    await page.getByRole("button", { name: "Add to project" }).click();
  });

  test("should display organization column in datasets grid", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();

    // Verify organization column header is present
    await expect(page.getByRole("columnheader", { name: /organization/i })).toBeVisible();

    // Verify file hash column is not present
    await expect(page.getByRole("columnheader", { name: /file hash/i })).toBeHidden();
  });

  test("should search datasets by organization name", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();

    // Search by organization name
    await page.getByTestId("app.datatable.search-input").fill("Test Organization");

    // Verify that at least one row is visible after search
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });

  test("should show readonly organization field in edit form", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();

    // Click the first dataset's edit button
    const firstEditButton = page.locator('[title="Edit"]').first();
    await firstEditButton.click();

    // Verify we're on the edit page
    await expect(page.getByTestId("admin.datasets.edit.page")).toBeVisible();

    // Verify organization field is present and disabled
    const organizationField = page.getByTestId("admin.datasets.edit.form.organization");
    await expect(organizationField).toBeVisible();
    await expect(organizationField).toBeDisabled();

    // Verify organization field has a value
    await expect(organizationField).not.toHaveValue("");
  });
});
