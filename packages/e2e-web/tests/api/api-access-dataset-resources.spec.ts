import { expect, test } from "@playwright/test";
import { testIds } from "../../config";
import { loginAs } from "./helpers";

const DATASET_WITH_VARIABLESETS_ID = testIds.datasets.withVariablesets;

const DOWNLOAD_ENDPOINT = `/api/datasets/${DATASET_WITH_VARIABLESETS_ID}/download`;
const PROJECTS_ENDPOINT = `/api/datasets/${DATASET_WITH_VARIABLESETS_ID}/projects`;
const STATS_ENDPOINT = `/api/datasets/${DATASET_WITH_VARIABLESETS_ID}/stats`;
const AVAILABLE_FOR_SPLIT_ENDPOINT = `/api/datasets/${DATASET_WITH_VARIABLESETS_ID}/variables/available-for-split`;
const UNASSIGNED_VARIABLES_ENDPOINT = `/api/datasets/${DATASET_WITH_VARIABLESETS_ID}/variables/unassigned`;

const STATS_BODY = JSON.stringify({
  variables: [{ variable: "id" }],
  decimal_places: 3,
});

test.describe("API dataset resources access @api", () => {
  test.describe("GET /api/datasets/:id/download", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.get(DOWNLOAD_ENDPOINT);
      expect(response.status()).toBe(401);
    });

    test("denies access for user with no organization", async ({ page }) => {
      await loginAs(page, "accountInNoOrg");

      const response = await page.request.get(DOWNLOAD_ENDPOINT);
      expect(response.status()).toBe(401);
    });

    test("allows access for regular user with dataset access", async ({ page }) => {
      await loginAs(page, "regularUser");

      const response = await page.request.get(DOWNLOAD_ENDPOINT);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-disposition"]).toContain("attachment; filename=");
    });

    test("allows access for admin without organization memberships", async ({ page }) => {
      await loginAs(page, "adminInNoOrg");

      const response = await page.request.get(DOWNLOAD_ENDPOINT);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-disposition"]).toContain("attachment; filename=");
    });
  });

  test.describe("GET /api/datasets/:id/projects", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.get(PROJECTS_ENDPOINT);
      expect(response.status()).toBe(401);
    });

    test("denies access for user with no organization", async ({ page }) => {
      await loginAs(page, "accountInNoOrg");

      const response = await page.request.get(PROJECTS_ENDPOINT);
      expect(response.status()).toBe(401);
    });

    test("allows access for regular user with dataset access", async ({ page }) => {
      await loginAs(page, "regularUser");

      const response = await page.request.get(PROJECTS_ENDPOINT);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.rows)).toBe(true);
      expect(data.count).toBeGreaterThan(0);
    });

    test("allows access for admin without organization memberships", async ({ page }) => {
      await loginAs(page, "adminInNoOrg");

      const response = await page.request.get(PROJECTS_ENDPOINT);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.rows)).toBe(true);
    });
  });

  test.describe("POST /api/datasets/:id/stats", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.post(STATS_ENDPOINT, {
        data: STATS_BODY,
        headers: { "Content-Type": "application/json" },
      });
      expect(response.status()).toBe(401);
    });

    test("denies access for user with no organization", async ({ page }) => {
      await loginAs(page, "accountInNoOrg");

      const response = await page.request.post(STATS_ENDPOINT, {
        data: STATS_BODY,
        headers: { "Content-Type": "application/json" },
      });
      expect(response.status()).toBe(401);
    });

    test("allows access for regular user with dataset access", async ({ page }) => {
      await loginAs(page, "regularUser");

      const response = await page.request.post(STATS_ENDPOINT, {
        data: STATS_BODY,
        headers: { "Content-Type": "application/json" },
      });
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("allows access for admin without organization memberships", async ({ page }) => {
      await loginAs(page, "adminInNoOrg");

      const response = await page.request.post(STATS_ENDPOINT, {
        data: STATS_BODY,
        headers: { "Content-Type": "application/json" },
      });
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  test.describe("GET /api/datasets/:id/variables/available-for-split", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.get(AVAILABLE_FOR_SPLIT_ENDPOINT);
      expect(response.status()).toBe(401);
    });

    test("denies access for user with no organization", async ({ page }) => {
      await loginAs(page, "accountInNoOrg");

      const response = await page.request.get(AVAILABLE_FOR_SPLIT_ENDPOINT);
      expect(response.status()).toBe(401);
    });

    test("allows access for regular user with dataset access", async ({ page }) => {
      await loginAs(page, "regularUser");

      const response = await page.request.get(AVAILABLE_FOR_SPLIT_ENDPOINT);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.rows)).toBe(true);
    });

    test("allows access for admin without organization memberships", async ({ page }) => {
      await loginAs(page, "adminInNoOrg");

      const response = await page.request.get(AVAILABLE_FOR_SPLIT_ENDPOINT);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.rows)).toBe(true);
    });
  });

  test.describe("GET /api/datasets/:id/variables/unassigned", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.get(UNASSIGNED_VARIABLES_ENDPOINT);
      expect(response.status()).toBe(401);
    });

    test("denies access for user with no organization", async ({ page }) => {
      await loginAs(page, "accountInNoOrg");

      const response = await page.request.get(UNASSIGNED_VARIABLES_ENDPOINT);
      expect(response.status()).toBe(401);
    });

    test("allows access for regular user with dataset access", async ({ page }) => {
      await loginAs(page, "regularUser");

      const response = await page.request.get(UNASSIGNED_VARIABLES_ENDPOINT);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.rows)).toBe(true);
    });

    test("allows access for admin without organization memberships", async ({ page }) => {
      await loginAs(page, "adminInNoOrg");

      const response = await page.request.get(UNASSIGNED_VARIABLES_ENDPOINT);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.rows)).toBe(true);
    });
  });
});
