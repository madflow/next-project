import { expect, test } from "@playwright/test";
import { testIds, testUsers } from "../../config";
import { loginUser } from "../../utils";

const TEST_ENDPOINT = `/api/datasets/${testIds.datasets.primary}/raw-data`;

const TEST_BODY = JSON.stringify({
  variables: ["v1"],
  options: { exclude_empty: true, page: 1, page_size: 5 },
});

test.describe("Api access dataset raw-data @api", () => {
  test("deny when not logged in", async ({ page }) => {
    const response = await page.request.post(TEST_ENDPOINT, { data: TEST_BODY });
    expect(response.status()).toBe(401);
  });

  test("deny logged in as user without org access", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.accountInNoOrg.email, testUsers.accountInNoOrg.password);
    const response = await page.request.post(TEST_ENDPOINT, { data: TEST_BODY });
    expect(response.status()).toBe(401);
  });

  test("allow logged in as regular user with org access", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.regularUser.email, testUsers.regularUser.password);
    const response = await page.request.post(TEST_ENDPOINT, { data: TEST_BODY });
    expect(response.status()).toBe(200);
  });

  test("allow logged in as admin user", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    const response = await page.request.post(TEST_ENDPOINT, { data: TEST_BODY });
    expect(response.status()).toBe(200);
  });
});
