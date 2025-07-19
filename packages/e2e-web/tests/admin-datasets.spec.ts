import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Admin Datasets", () => {
  test("should upload a dataset successfully and assign to project", async ({ page }) => {
    const datasetName = `Test Dataset ${Date.now().toLocaleString()}`;
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/datasets");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();
    await page.getByTestId("admin.datasets.create.upload").click();
    const uploadFile = page.getByTestId("file-upload-input");
    await uploadFile.setInputFiles("testdata/spss/demo.sav");
    await page.waitForSelector("data-testid=app.admin.dataset.selected-file");
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
    await page.getByRole("textbox", { name: "Label" }).click();
    await page.getByRole("textbox", { name: "Label" }).fill("Age in years edited");
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByTestId("app.admin.editor.projects.tab").click();
    await page.getByTestId("project-dropdown").click();
    await page.getByTestId("project-dropdown-item-test-project").getByText("Test Project").click();
    await page.getByRole("button", { name: "Add to project" }).click;
  });
});
