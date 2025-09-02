import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Admin organizations", () => {
  test.describe.configure({ mode: "parallel" });
  test("list", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/organizations");
    await expect(page.getByTestId("admin.organizations.page")).toBeVisible();
  });
  test("create and edit", async ({ page }) => {
    const newOrganization = {
      name: "E2E Organization",
      slug: "e2e-organization-" + Date.now(),
    };
    const editOrganization = {
      name: "E2E Organization 2",
      slug: "e2e-organization-2-" + Date.now(),
    };
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/organizations/new");
    await expect(page.getByTestId("admin.organizations.new.page")).toBeVisible();
    await page.getByTestId("admin.organizations.new.form.name").fill(newOrganization.name);
    await page.getByTestId("admin.organizations.new.form.slug").fill(newOrganization.slug);
    await page.getByTestId("theme-name-0").fill("CompanyTheme");
    await page.getByTestId("theme-color-0-chart-1").fill("#eeeeee");

    // Submit the form and wait for the response
    await page.getByTestId("admin.organizations.new.form.submit").click();

    await expect(page.getByTestId("admin.organizations.page")).toBeVisible();
    await page.getByTestId(`admin.organizations.list.edit-${newOrganization.slug}`).click();
    await expect(page.getByTestId("admin.organizations.edit.page")).toBeVisible();
    await expect(page.getByTestId("theme-name-0")).toHaveValue("CompanyTheme");
    await expect(page.getByTestId("theme-color-0-chart-1")).toHaveValue("#eeeeee");
    await page.getByTestId("admin.organizations.edit.form.name").fill(editOrganization.name);
    await page.getByTestId("admin.organizations.edit.form.slug").fill(editOrganization.slug);

    // Submit the form and wait for the response
    await page.getByTestId("admin.organizations.edit.form.submit").click();

    await expect(page.getByTestId("admin.organizations.page")).toBeVisible();
    await expect(page.getByTestId(`admin.organizations.list.edit-${editOrganization.slug}`)).toBeVisible();
  });
});
