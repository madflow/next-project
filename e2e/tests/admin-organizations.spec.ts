import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Admin organizations", () => {
  test("list", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/organizations");
    await expect(page.getByTestId("admin.organizations.page")).toBeVisible();
  });
  test("create and edit", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/organizations/new");
    await expect(page.getByTestId("admin.organizations.new.page")).toBeVisible();
    await page.getByTestId("admin.organizations.new.form.name").fill("E2E Organization");
    await page.getByTestId("admin.organizations.new.form.slug").fill("e2e-organization");

    // Submit the form and wait for the response
    await page.getByTestId("admin.organizations.new.form.submit").click();

    await expect(page.getByTestId("admin.organizations.page")).toBeVisible();
    await page.getByTestId("admin.organizations.list.edit-e2e-organization").click();
    await expect(page.getByTestId("admin.organizations.edit.page")).toBeVisible();
    await page.getByTestId("admin.organizations.edit.form.name").fill("E2E Organization 2");
    await page.getByTestId("admin.organizations.edit.form.slug").fill("e2e-organization-2");

    // Submit the form and wait for the response
    await page.getByTestId("admin.organizations.edit.form.submit").click();

    await expect(page.getByTestId("admin.organizations.page")).toBeVisible();
    await expect(page.getByTestId("admin.organizations.list.edit-e2e-organization-2")).toBeVisible();
  });
});
