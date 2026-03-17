import { expect, test } from "@playwright/test";
import { testUsers } from "../../config";
import { loginAs } from "./helpers";

const USERS_ENDPOINT = "/api/users";
const USER_DETAIL_ENDPOINT = `/api/users/${testUsers.regularUser.id}`;

test.describe("API users admin access @api", () => {
  test.describe("GET /api/users", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.get(USERS_ENDPOINT);
      expect(response.status()).toBe(401);
    });

    test("denies access for regular user", async ({ page }) => {
      await loginAs(page, "regularUser");

      const response = await page.request.get(USERS_ENDPOINT);
      expect(response.status()).toBe(401);
    });

    test("allows access for admin without organization memberships", async ({ page }) => {
      await loginAs(page, "adminInNoOrg");

      const response = await page.request.get(USERS_ENDPOINT);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.rows)).toBe(true);
      expect(data.count).toBeGreaterThan(0);
    });
  });

  test.describe("GET /api/users/:id", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.get(USER_DETAIL_ENDPOINT);
      expect(response.status()).toBe(401);
    });

    test("denies access for regular user", async ({ page }) => {
      await loginAs(page, "regularUser");

      const response = await page.request.get(USER_DETAIL_ENDPOINT);
      expect(response.status()).toBe(401);
    });

    test("allows access for admin without organization memberships", async ({ page }) => {
      await loginAs(page, "adminInNoOrg");

      const response = await page.request.get(USER_DETAIL_ENDPOINT);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.id).toBe(testUsers.regularUser.id);
    });
  });
});
