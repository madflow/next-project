import { expect, test } from "@playwright/test";
import { TEST_ORGANIZATION_ID, loginAs } from "./helpers";

const ORGANIZATION_ENDPOINT = `/api/organizations/${TEST_ORGANIZATION_ID}`;
const ORGANIZATION_PROJECTS_ENDPOINT = `/api/organizations/${TEST_ORGANIZATION_ID}/projects`;

test.describe("API organizations by id access @api", () => {
  test.describe("GET /api/organizations/:id", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.get(ORGANIZATION_ENDPOINT);
      expect(response.status()).toBe(401);
    });

    test("denies access for user with no organization", async ({ page }) => {
      await loginAs(page, "accountInNoOrg");

      const response = await page.request.get(ORGANIZATION_ENDPOINT);
      expect(response.status()).toBe(401);
    });

    test("allows access for regular user in the organization", async ({ page }) => {
      await loginAs(page, "regularUser");

      const response = await page.request.get(ORGANIZATION_ENDPOINT);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.id).toBe(TEST_ORGANIZATION_ID);
    });

    test("allows access for admin without organization memberships", async ({ page }) => {
      await loginAs(page, "adminInNoOrg");

      const response = await page.request.get(ORGANIZATION_ENDPOINT);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.id).toBe(TEST_ORGANIZATION_ID);
    });
  });

  test.describe("GET /api/organizations/:id/projects", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.get(ORGANIZATION_PROJECTS_ENDPOINT);
      expect(response.status()).toBe(401);
    });

    test("denies access for user with no organization", async ({ page }) => {
      await loginAs(page, "accountInNoOrg");

      const response = await page.request.get(ORGANIZATION_PROJECTS_ENDPOINT);
      expect(response.status()).toBe(401);
    });

    test("allows access for regular user in the organization", async ({ page }) => {
      await loginAs(page, "regularUser");

      const response = await page.request.get(ORGANIZATION_PROJECTS_ENDPOINT);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.rows)).toBe(true);
      expect(data.count).toBeGreaterThan(0);
    });

    test("allows access for admin without organization memberships", async ({ page }) => {
      await loginAs(page, "adminInNoOrg");

      const response = await page.request.get(ORGANIZATION_PROJECTS_ENDPOINT);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.rows)).toBe(true);
    });
  });
});
