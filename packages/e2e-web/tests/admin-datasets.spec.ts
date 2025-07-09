import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Admin Datasets", () => {
  test("should upload a dataset successfully", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/datasets");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();
    await page.getByTestId("admin.datasets.create.upload").click();
    const uploadFile = page.getByTestId("app.admin.dataset.file-upload");
    await uploadFile.setInputFiles("testdata/spss/demo.sav");
    await page.waitForSelector("data-testid=app.admin.dataset.selected-file");
    await page.getByTestId("app.admin.dataset.organization-trigger").click();
    await page.getByTestId("org-option-test-organization").click();
    await page.getByTestId("app.admin.dataset.upload-button").click();
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();
  });
});
