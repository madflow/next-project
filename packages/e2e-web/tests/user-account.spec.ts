import { type Page, expect, test } from "@playwright/test";
import path from "path";
import { testUsers } from "../config";
import { extractLinkFromMessage, getLatestEmail, loginUser, logoutUser, smtpServerApi } from "../utils";

const ALTERNATE_PASSWORD = "Tester1234567";
const EMAIL_PRIMARY = testUsers.adminInNoOrg.email;
const EMAIL_SECONDARY = "admin-in-no-org-alt@example.com";
const EMAIL_PASSWORD = testUsers.adminInNoOrg.password;

function getNextLocale(currentLang: string) {
  return currentLang === "de" ? "en" : "de";
}

function getLocaleOptionName(currentLang: string) {
  return currentLang === "de" ? "Englisch" : "German";
}

function getNextPassword(currentPassword: string) {
  return currentPassword === testUsers.accountInNoOrg.password ? ALTERNATE_PASSWORD : testUsers.accountInNoOrg.password;
}

function getNextEmail(currentEmail: string) {
  return currentEmail === EMAIL_PRIMARY ? EMAIL_SECONDARY : EMAIL_PRIMARY;
}

async function openAccountPage(page: Page, email: string, password: string) {
  await page.goto("/");
  await loginUser(page, email, password);
  await page.goto("/user/account");
  await expect(page).toHaveURL(/\/user\/account$/);
  await expect(page.getByTestId("app.user.account.page")).toBeVisible();
}

async function tryLogin(page: Page, email: string, password: string) {
  await page.goto("/");
  await expect(page.getByTestId("auth.login.form.submit")).toBeVisible();
  await page.getByTestId("auth.login.form.email").fill(email);
  await page.getByTestId("auth.login.form.password").fill(password);
  await page.getByTestId("auth.login.form.submit").click();

  try {
    await expect(page.getByTestId("app.sidebar.user-menu-trigger")).toBeVisible({ timeout: 5000 });
    return true;
  } catch {
    await expect(page.getByTestId("auth.login.form.submit")).toBeVisible();
    return false;
  }
}

async function loginWithAnyPassword(page: Page, email: string, passwords: string[]) {
  for (const password of passwords) {
    if (await tryLogin(page, email, password)) {
      return password;
    }
  }

  throw new Error(`Unable to log in as ${email} with any known password`);
}

async function loginWithAnyEmail(page: Page, emails: string[], password: string) {
  for (const email of emails) {
    if (await tryLogin(page, email, password)) {
      return email;
    }
  }

  throw new Error("Unable to log in with any known email");
}

async function clearMailbox(email: string) {
  await smtpServerApi.deleteMessagesBySearch({ query: `to:"${email}"` });
}

async function waitForMailboxMessage(email: string) {
  const message = await getLatestEmail(email);
  expect(message, `Expected a Mailpit message for ${email}`).toBeTruthy();
  return message!;
}

test.describe("User Account", () => {

  test("navigates to account settings and updates profile name and locale", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.profileChanger.email, testUsers.profileChanger.password);
    await page.getByTestId("app.sidebar.user-menu-trigger").click();
    await page.getByTestId("app.nav-user.account").click();

    await expect(page).toHaveURL(/\/user\/account$/);
    await expect(page.getByTestId("app.user.account.page")).toBeVisible();

    const newName = `Profile Changer ${Date.now()}`;
    const currentLang = (await page.locator("html").getAttribute("lang")) ?? "en";
    const nextLang = getNextLocale(currentLang);
    const optionName = getLocaleOptionName(currentLang);

    await page.getByTestId("app.user.account.profile.name").fill(newName);
    await page.getByTestId("app.user.account.profile.locale").click();
    await page.getByRole("option", { name: optionName }).click();

    const updateProfileResponse = page.waitForResponse(
      (response) => response.url().includes("/api/auth/update-user") && response.ok()
    );
    await page.getByTestId("app.user.account.profile.update").click();
    await updateProfileResponse;

    await expect(page.locator("html")).toHaveAttribute("lang", nextLang);
    await expect(page.getByTestId("app.user.account.profile.name")).toHaveValue(newName);

    await page.reload();
    await expect(page.getByTestId("app.user.account.page")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", nextLang);
    await expect(page.getByTestId("app.user.account.profile.name")).toHaveValue(newName);
  });

  test("updates password and logs in with the new password", async ({ page }) => {
    const email = testUsers.accountInNoOrg.email;
    const currentPassword = await loginWithAnyPassword(page, email, [
      testUsers.accountInNoOrg.password,
      ALTERNATE_PASSWORD,
    ]);
    const nextPassword = getNextPassword(currentPassword);

    await page.goto("/user/account");
    await expect(page.getByTestId("app.user.account.page")).toBeVisible();

    const currentPasswordInput = page.getByTestId("app.user.account.password.current");
    const newPasswordInput = page.getByTestId("app.user.account.password.new");
    const confirmPasswordInput = page.getByTestId("app.user.account.password.confirm");

    await currentPasswordInput.fill(currentPassword);
    await newPasswordInput.fill(nextPassword);
    await confirmPasswordInput.fill(nextPassword);
    await page.getByTestId("app.user.account.password.update").click();

    await expect(currentPasswordInput).toHaveValue("");
    await expect(newPasswordInput).toHaveValue("");
    await expect(confirmPasswordInput).toHaveValue("");

    await logoutUser(page);
    await loginUser(page, email, nextPassword);
    await expect(page.getByTestId("app.sidebar.user-menu-trigger")).toBeVisible();
  });

  test("updates email, verifies it, and logs in with the new email", async ({ page }) => {
    await clearMailbox(EMAIL_PRIMARY);
    await clearMailbox(EMAIL_SECONDARY);

    const currentEmail = await loginWithAnyEmail(page, [EMAIL_PRIMARY, EMAIL_SECONDARY], EMAIL_PASSWORD);
    const nextEmail = getNextEmail(currentEmail);

    await page.goto("/user/account");
    await expect(page.getByTestId("app.user.account.page")).toBeVisible();

    const changeEmailResponse = page.waitForResponse(
      (response) => response.url().includes("/api/auth/change-email") && response.ok()
    );
    await page.getByTestId("app.user.account.email").fill(nextEmail);
    await page.getByTestId("app.user.account.email.update").click();
    await changeEmailResponse;

    await expect(page.getByTestId("app.user.account.email")).toHaveValue("");

    const verificationMessage = await waitForMailboxMessage(currentEmail);
    const verifyLink = await extractLinkFromMessage(verificationMessage, "verify-email");
    expect(verifyLink).toBeTruthy();

    await logoutUser(page);
    await page.goto(verifyLink);
    await page.waitForURL(/\/auth\/login|\/auth\/verify-email|\/user\/account/, { timeout: 10000 });

    const newAddressMessage = await waitForMailboxMessage(nextEmail);
    expect(newAddressMessage.Subject).toBeTruthy();

    const newEmailVerifyLink = await extractLinkFromMessage(newAddressMessage, "verify-email");
    expect(newEmailVerifyLink).toBeTruthy();

    await page.goto(newEmailVerifyLink);
    await page.waitForURL(/\/auth\/login|\/auth\/verify-email|\/user\/account/, { timeout: 10000 });
    await page.goto("/");
    await expect(page.getByTestId("app.sidebar.user-menu-trigger")).toBeVisible();
    await expect(page.getByTestId("app.sidebar.user-menu-trigger")).toContainText(nextEmail);

    await clearMailbox(EMAIL_PRIMARY);
    await clearMailbox(EMAIL_SECONDARY);
  });

  test.describe("avatar", () => {
    test.describe.configure({ mode: "serial" });

    test("uploads an avatar and keeps showing it after reload", async ({ page }) => {
      await openAccountPage(page, testUsers.avatarUser.email, testUsers.avatarUser.password);

      const avatarPath = path.join(__dirname, "../testdata/avatar.png");
      await page.getByTestId("app.user.account.avatar-file-input").setInputFiles(avatarPath);

      const saveButton = page.getByTestId("app.user.account.avatar-save-button");
      const avatarPreview = page.getByTestId("app.user.account.avatar-image-preview");

      await expect(saveButton).toBeVisible();
      await expect(saveButton).toBeEnabled();
      await saveButton.click();

      await expect(saveButton).toBeHidden();
      await expect(avatarPreview).toBeVisible();
      await expect(avatarPreview).toHaveAttribute("src", /\/api\/users\/.+\/avatars\/.+\.(png|jpe?g|webp)$/i);

      await page.reload();
      await expect(page.getByTestId("app.user.account.page")).toBeVisible();
      await expect(avatarPreview).toBeVisible();
      await expect(avatarPreview).toHaveAttribute("src", /\/api\/users\/.+\/avatars\/.+\.(png|jpe?g|webp)$/i);
    });

    test("rejects fake PNG and SVG avatar uploads", async ({ page }) => {
      await openAccountPage(page, testUsers.avatarUser.email, testUsers.avatarUser.password);

      const fileInput = page.getByTestId("app.user.account.avatar-file-input");
      const errorMessage = page.getByText(
        /Could not detect file type|Only WebP, PNG, and JPEG images are allowed|Invalid file type: Only WebP, PNG, and JPEG images are allowed/i
      );

      const fakePngPath = path.join(__dirname, "../testdata/avatar-fake.png");
      await fileInput.setInputFiles(fakePngPath);
      await page.getByTestId("app.user.account.avatar-save-button").click();
      await expect(errorMessage.first()).toBeVisible();

      await page.reload();
      await expect(page.getByTestId("app.user.account.page")).toBeVisible();

      const svgPath = path.join(__dirname, "../testdata/avatar.svg");
      await fileInput.setInputFiles(svgPath);
      await expect(
        page.getByText(/Invalid file type: Only WebP, PNG, and JPEG images are allowed/i).first()
      ).toBeVisible();
      await expect(page.getByTestId("app.user.account.avatar-save-button")).toBeHidden();
    });
  });

  test("deletes the account and redirects to goodbye", async ({ page }) => {
    await openAccountPage(page, testUsers.accountDeleter.email, testUsers.accountDeleter.password);

    const deleteButton = page.getByTestId("app.user.account.delete-account");
    await deleteButton.scrollIntoViewIfNeeded();
    await deleteButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await page.getByTestId("app.user.account.delete.password").fill(testUsers.accountDeleter.password);
    const confirmButton = page.getByTestId("app.user.account.delete-account-confirm");
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    await expect(page).toHaveURL(/\/goodbye$/);
  });
});
