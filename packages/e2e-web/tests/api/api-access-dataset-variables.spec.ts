import { expect, test } from "@playwright/test";
import { testIds, testUsers } from "../../config";
import { loginUser } from "../../utils";

const TEST_ENDPOINT = `/api/datasets/${testIds.datasets.primary}/variables`;

test.describe("Api access dataset variables @api", () => {
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
