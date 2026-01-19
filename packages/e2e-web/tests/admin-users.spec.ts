import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Admin users", () => {
  test.describe.configure({ mode: "parallel" });

  test("list", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/users");
    await expect(page.getByTestId("admin.users.page")).toBeVisible();
  });

  test("create and edit", async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;

    await page.goto("/");

    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to create user page
    await page.goto("/admin/users/new");
    await expect(page.getByTestId("admin.users.new.page")).toBeVisible();

    // Fill in the form
    await page.getByTestId("admin.users.new.form.name").fill("Test User");
    await page.getByTestId("admin.users.new.form.email").fill(testEmail);

    await page.getByTestId("admin.users.new.form.submit").click();

    // Verify user was created
    await expect(page.getByTestId("admin.users.page")).toBeVisible();

    // Edit the user
    await page.getByRole("textbox", { name: "Search" }).fill(testEmail);
    await page.getByTestId(`admin.users.list.edit-${testEmail}`).click();
    await expect(page.getByTestId("admin.users.edit.page")).toBeVisible();

    // Update user details
    const updatedEmail = `updated-${testEmail}`;
    await page.getByTestId("admin.users.edit.form.name").fill("Updated Test User");
    await page.getByTestId("admin.users.edit.form.email").fill(updatedEmail);

    await page.getByTestId("admin.users.edit.form.submit").click();

    await page.getByRole("textbox", { name: "Search" }).fill(updatedEmail);
    // Wait for the updated user to appear in the list
    await expect(page.getByTestId(`admin.users.list.edit-${updatedEmail}`)).toBeVisible({ timeout: 10000 });
  });
});
