import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { extractLinkFromMessage, loginUser, logoutUser, smtpServerApi } from "../utils";

test.describe("User Account", () => {
  test.describe.configure({ mode: "serial" });
  test("should log in and navigate to account settings", async ({ page }) => {
    // Navigate to the login page
    await page.goto("/");

    // Log in as the profile user
    await loginUser(page, testUsers.profileChanger.email, testUsers.profileChanger.password);

    // Open user menu
    const userMenuTrigger = page.getByTestId("app.sidebar.user-menu-trigger");
    await userMenuTrigger.click();

    // Click on Account menu item
    const accountLink = page.getByRole("menuitem", { name: "Account" });
    await accountLink.click();

    // Navigate to account page and verify container is visible
    await page.waitForURL(/\/user\/account/);
    await expect(page.getByTestId("app.user.account.page")).toBeVisible();
  });

  test("should update profile name and locale", async ({ page }) => {
    // Navigate to the login page
    await page.goto("/");

    // Log in as the profile user
    await loginUser(page, testUsers.profileChanger.email, testUsers.profileChanger.password);

    // Navigate to account page
    await page.goto("/user/account");
    await page.waitForURL(/\/user\/account/);

    // Update name using test ID
    const newName = `Test User ${Date.now()}`;
    await page.getByTestId("app.user.account.profile.name").fill(newName);

    // Update locale to German
    await page.getByTestId("app.user.account.profile.locale").click();
    await page.getByRole("option", { name: "German" }).click();

    // Submit the form
    await page.getByTestId("app.user.account.profile.update").click();
    await page.waitForLoadState("networkidle");

    await expect(page.locator("html")).toHaveAttribute("lang", "de");

    // Verify the name and locale were updated
    await expect(page.getByTestId("app.user.account.profile.name")).toHaveValue(newName);
    await expect(page.getByTestId("app.user.account.profile.locale")).toContainText("Deutsch");

    await page.getByTestId("app.user.account.profile.locale").click();
    await page.getByRole("option", { name: "Englisch" }).click();

    // Submit the form
    await page.getByTestId("app.user.account.profile.update").click();
  });

  test("should update user password", async ({ page }) => {
    // Navigate to the login page and log in
    await page.goto("/");
    await loginUser(page, testUsers.profileChanger.email, testUsers.profileChanger.password);

    // Navigate to account page
    await page.goto("/user/account");
    await page.waitForURL(/\/user\/account/);

    // Fill out the password update form
    await page.locator("html").click();
    await page.getByTestId("app.user.account.password.current").click();
    await page.getByTestId("app.user.account.password.current").fill("Tester12345");

    const newPassword = "Tester1234567";
    await page.getByTestId("app.user.account.password.new").click();
    await page.getByTestId("app.user.account.password.new").fill(newPassword);
    await page.getByTestId("app.user.account.password.confirm").click();
    await page.getByTestId("app.user.account.password.confirm").fill(newPassword);

    // Submit the password update form
    await page.getByTestId("app.user.account.password.update").click();

    await page.waitForLoadState("networkidle");

    await logoutUser(page);

    // Log in with the new password
    await loginUser(page, testUsers.profileChanger.email, newPassword);

    // Verify login was successful by checking for user menu
    await expect(page.getByTestId("app.sidebar.user-menu-trigger")).toBeVisible();
  });

  test("should update user email", async ({ page }) => {
    // Generate a unique email with timestamp
    const newEmail = `updated-${Date.now()}@example.com`;

    // Navigate to the login page and log in as email changer
    await page.goto("/");
    await loginUser(page, testUsers.emailChanger.email, testUsers.emailChanger.password);

    // Navigate to account page
    await page.goto("/user/account");
    await page.waitForURL(/\/user\/account/);

    // Fill out the email update form
    await page.getByTestId("app.user.account.email").fill(newEmail);

    // Submit the form
    await page.getByTestId("app.user.account.email.update").click();
    await page.waitForLoadState("networkidle");

    // Wait for the verification email (sent to the old email address)
    const searchMessages = await smtpServerApi.searchMessages({
      query: `to:"${testUsers.emailChanger.email}"`,
    });

    expect(searchMessages.messages.length).toBe(1);
    const message = searchMessages.messages[0];
    const verifyLink = await extractLinkFromMessage(message, "verify-email");

    expect(verifyLink).toBeTruthy();

    // Navigate to the verification link
    await page.goto(verifyLink);

    const newEmailMessages = await smtpServerApi.searchMessages({
      query: `to:"${newEmail}"`,
    });

    expect(newEmailMessages.messages.length).toBe(1);
    smtpServerApi.deleteMessagesBySearch({ query: `to:"${newEmail}"` });
  });

  test("should upload and display a new avatar", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.avatarUser.email, testUsers.avatarUser.password);

    await page.waitForLoadState("networkidle");

    await page.goto("/user/account");
    await page.waitForLoadState("networkidle");

    const avatarContainer = page.getByTestId("app.user.account.avatar-container");
    await avatarContainer.waitFor({ state: "visible", timeout: 15001 });

    await page.waitForSelector("data-testid=app.user.account.avatar-upload-button");
    await page.getByTestId("app.user.account.avatar-upload-button").click();

    const fileInput = page.getByTestId("app.user.account.avatar-file-input");
    await fileInput.setInputFiles({
      name: "avatar.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#000000"><circle cx="50" cy="50" r="40" /></svg>'
      ),
    });
    //             data-testid="app.user.account.avatar-save-button">

    const uploadPromise = page.waitForRequest(/avatar/);
    await page.getByTestId("app.user.account.avatar-save-button").click();
    await uploadPromise;

    await page.waitForSelector("data-testid=app.user.account.avatar-container");
    await expect(page.getByTestId("app.user.account.avatar-container")).toBeVisible();
    const avatarExistsResponse = page.waitForResponse(
      /\/api\/users\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/avatars\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.svg/i
    );
    await page.reload();
    await avatarExistsResponse;
    await page.waitForSelector("data-testid=app.user.account.avatar-container");
    await expect(page.getByTestId("app.user.account.avatar-container")).toBeVisible();
  });

  test("should delete user account and redirect to goodbye page", async ({ page }) => {
    // Log in as the account deleter user
    await page.goto("/");
    await loginUser(page, testUsers.accountDeleter.email, testUsers.accountDeleter.password);

    // Navigate to account page
    await page.goto("/user/account");
    await page.waitForURL(/\/user\/account/);

    // Scroll to the delete account section (it's at the bottom of the page)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Click the delete account button
    await page.getByTestId("app.user.account.delete-account").click();

    // Wait for the confirmation dialog
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    page.getByTestId("app.user.account.delete.password").fill(testUsers.accountDeleter.password);

    // Confirm account deletion using the test ID from the dialog
    const confirmButton = page.getByTestId("app.user.account.delete-account-confirm");
    await confirmButton.click();

    // Wait for the goodbye page to load
    await page.waitForURL("/goodbye");
  });
});
