import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Api organizations", () => {
  test("list not logged in", async ({ page }) => {
    const list = await page.request.get("/api/organizations");
    expect(list.status()).toBe(401);
  });

  test("list logged in as regular user", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.regularUser.email, testUsers.regularUser.password);
    const list = await page.request.get("/api/organizations");
    expect(list.status()).toBe(401);
  });

  test("list logged in as admin user", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    const list = await page.request.get("/api/organizations");
    expect(list.status()).toBe(200);
  });
});
