import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe.configure({ mode: "parallel" });
test.describe("Api members", () => {
  test("list not logged in", async ({ page }) => {
    const notLoggedIn = await page.request.get("/api/members");
    expect(notLoggedIn.status()).toBe(401);
  });

  test("list logged in as regular user", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.regularUser.email, testUsers.regularUser.password);
    const list = await page.request.get("/api/members");
    expect(list.status()).toBe(401);
  });

  test("list logged in as admin user", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    const list = await page.request.get("/api/members");
    expect(list.status()).toBe(200);
  });
});
