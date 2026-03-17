import { type Browser, expect, test } from "@playwright/test";
import path from "path";
import { resolvedBaseUrl, testUsers } from "../../config";
import { loginAs, withUserPage } from "./helpers";

let avatarPath = "";

async function uploadAvatarAndGetPath(browser: Browser) {
  return await withUserPage(browser, "avatarUser", async (page) => {
    await page.goto("/user/account");
    await expect(page.getByTestId("app.user.account.page")).toBeVisible();

    const avatarFilePath = path.join(__dirname, "../../testdata/avatar.png");
    await page.getByTestId("app.user.account.avatar-file-input").setInputFiles(avatarFilePath);

    const saveButton = page.getByTestId("app.user.account.avatar-save-button");
    const avatarPreview = page.getByTestId("app.user.account.avatar-image-preview");

    await expect(saveButton).toBeVisible();
    await saveButton.click();

    await expect(saveButton).toBeHidden();
    await expect(avatarPreview).toHaveAttribute("src", /\/api\/users\/.+\/avatars\/.+\.(png|jpe?g|webp)$/i);

    const src = await avatarPreview.getAttribute("src");
    if (!src) {
      throw new Error("Avatar preview source not found");
    }

    return new URL(src, resolvedBaseUrl).pathname;
  });
}

test.describe("API user avatar access @api", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ browser }) => {
    avatarPath = await uploadAvatarAndGetPath(browser);
  });

  test("denies access when not logged in", async ({ page }) => {
    const response = await page.request.get(avatarPath);
    expect(response.status()).toBe(401);
  });

  test("denies access for another regular user", async ({ page }) => {
    await loginAs(page, "regularUser");

    const response = await page.request.get(avatarPath);
    expect(response.status()).toBe(403);
  });

  test("allows access for the avatar owner", async ({ page }) => {
    await loginAs(page, "avatarUser");

    const response = await page.request.get(avatarPath);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/");
  });

  test("allows access for admin without organization memberships", async ({ page }) => {
    await loginAs(page, "adminInNoOrg");

    const response = await page.request.get(avatarPath);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/");
  });

  test("uses the avatar owner route", async () => {
    expect(avatarPath).toContain(`/api/users/${testUsers.avatarUser.id}/avatars/`);
  });
});
