import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Admin organization members", () => {
  let newOrganization: {
    name: string;
    slug: string;
  };
  test.beforeAll(async () => {
    newOrganization = {
      name: "E2E Organization with Members",
      slug: "e2e-organization-members",
    };
  });
  test("create and add members", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/organizations/new");
    await expect(page.getByTestId("admin.organizations.new.page")).toBeVisible();
    await page.getByTestId("admin.organizations.new.form.name").fill(newOrganization.name);
    await page.getByTestId("admin.organizations.new.form.slug").fill(newOrganization.slug);

    await page.getByTestId("admin.organizations.new.form.submit").click();

    await expect(page.getByTestId("admin.organizations.page")).toBeVisible();
    await page.getByTestId(`admin.organizations.list.link-${newOrganization.slug}`).click();
    await expect(page.getByTestId("admin.organization-members.page")).toBeVisible();
  });
});
