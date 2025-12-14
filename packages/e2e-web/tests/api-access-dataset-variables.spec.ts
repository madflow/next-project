import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

const TEST_ENDPOINT = "/api/datasets/0198e639-3e96-734b-b0db-af0c4350a2c4/variables";

test.describe("Api access dataset variables", () => {
  test.describe.configure({ mode: "parallel" });

  test("deny logged in as regular user", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.accountInNoOrg.email, testUsers.accountInNoOrg.password);
    const list = await page.request.get(TEST_ENDPOINT);
    expect(list.status()).toBe(401);
  });

  test("list logged in as regular user", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.regularUser.email, testUsers.regularUser.password);
    const list = await page.request.get(TEST_ENDPOINT);
    expect(list.status()).toBe(200);
  });

  test("list logged in as admin user", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    const list = await page.request.get(TEST_ENDPOINT);
    expect(list.status()).toBe(200);
  });
});
