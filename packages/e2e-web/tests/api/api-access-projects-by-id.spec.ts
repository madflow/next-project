import { expect, test } from "@playwright/test";
import { testIds } from "../../config";
import { loginAs } from "./helpers";

const TEST_PROJECT_ID = testIds.projects.primary;

const PROJECT_ENDPOINT = `/api/projects/${TEST_PROJECT_ID}`;

test.describe("API projects by id access @api", () => {
  test.describe("GET /api/projects/:id", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.get(PROJECT_ENDPOINT);
      expect(response.status()).toBe(401);
    });

    test("denies access for user with no organization", async ({ page }) => {
      await loginAs(page, "accountInNoOrg");

      const response = await page.request.get(PROJECT_ENDPOINT);
      expect(response.status()).toBe(401);
    });

    test("allows access for regular user in the project organization", async ({ page }) => {
      await loginAs(page, "regularUser");

      const response = await page.request.get(PROJECT_ENDPOINT);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.id).toBe(TEST_PROJECT_ID);
    });

    test("allows access for admin without organization memberships", async ({ page }) => {
      await loginAs(page, "adminInNoOrg");

      const response = await page.request.get(PROJECT_ENDPOINT);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.id).toBe(TEST_PROJECT_ID);
    });
  });
});
