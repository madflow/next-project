import { test } from "@playwright/test";
import { AdminUsersPage } from "../pages/AdminUsersPage";
import { LoginPage } from "../pages/LoginPage";

test.describe("Admin users", () => {
  test.describe.configure({ mode: "parallel" });

  test("list", async ({ page }) => {
    // Already authenticated via storage state
    const adminUsersPage = new AdminUsersPage(page);
    await adminUsersPage.goto();
    await adminUsersPage.verifyPageVisible();
  });

  test("create and edit", async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const adminUsersPage = new AdminUsersPage(page);

    // Navigate to create user page
    await adminUsersPage.gotoCreate();

    // Create user
    await adminUsersPage.createUser("Test User", testEmail);

    // Verify user was created
    await adminUsersPage.verifyPageVisible();

    // Edit the user
    await adminUsersPage.searchUser(testEmail);
    await adminUsersPage.editUser(testEmail);

    // Update user details
    const updatedEmail = `updated-${testEmail}`;
    await adminUsersPage.updateUser("Updated Test User", updatedEmail);

    await adminUsersPage.searchUser(updatedEmail);
    // Wait for the updated user to appear in the list
    await adminUsersPage.verifyUserVisible(updatedEmail);
  });
});
