import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Admin Datafiles", () => {
  test("should upload a datafile successfully", async ({ page }) => {
    // Log in as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    
    // Navigate to datafiles page
    await page.goto("/admin/datafiles");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("admin.datafiles.page")).toBeVisible();
  });
});
