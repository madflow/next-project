import { type Page, expect, test } from "@playwright/test";
import { testIds } from "../../config";
import { loginAs, withUserPage } from "../../utils";

const DATASET_WITH_VARIABLESETS_ID = testIds.datasets.withVariablesets;

const LIST_ENDPOINT = `/api/datasets/${DATASET_WITH_VARIABLESETS_ID}/splitvariables`;
const AVAILABLE_FOR_SPLIT_ENDPOINT = `/api/datasets/${DATASET_WITH_VARIABLESETS_ID}/variables/available-for-split`;
const PLACEHOLDER_VARIABLE_ID = testIds.nonExistent;

async function getAvailableVariableId(page: Page) {
  const response = await page.request.get(AVAILABLE_FOR_SPLIT_ENDPOINT);
  expect(response.status()).toBe(200);

  const data = (await response.json()) as { rows: Array<{ id: string }> };
  const variableId = data.rows[0]?.id;

  if (!variableId) {
    throw new Error("No available split variable found");
  }

  return variableId;
}

test.describe("API dataset split variables access @api", () => {
  test.describe("GET /api/datasets/:id/splitvariables", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.get(LIST_ENDPOINT);
      expect(response.status()).toBe(401);
    });

    test("denies access for user with no organization", async ({ page }) => {
      await loginAs(page, "accountInNoOrg");

      const response = await page.request.get(LIST_ENDPOINT);
      expect(response.status()).toBe(401);
    });

    test("allows access for regular user with dataset access", async ({ page }) => {
      await loginAs(page, "regularUser");

      const response = await page.request.get(LIST_ENDPOINT);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.rows)).toBe(true);
      expect(data.count).toBeGreaterThan(0);
    });

    test("allows access for admin without organization memberships", async ({ page }) => {
      await loginAs(page, "adminInNoOrg");

      const response = await page.request.get(LIST_ENDPOINT);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.rows)).toBe(true);
    });
  });

  test.describe("POST /api/datasets/:id/splitvariables/:variableId", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.post(
        `/api/datasets/${DATASET_WITH_VARIABLESETS_ID}/splitvariables/${PLACEHOLDER_VARIABLE_ID}`
      );
      expect(response.status()).toBe(401);
    });

    test("denies access for user with no organization", async ({ page }) => {
      await loginAs(page, "accountInNoOrg");

      const response = await page.request.post(
        `/api/datasets/${DATASET_WITH_VARIABLESETS_ID}/splitvariables/${PLACEHOLDER_VARIABLE_ID}`
      );
      expect(response.status()).toBe(401);
    });

    test("denies access for regular user with dataset access", async ({ page }) => {
      await loginAs(page, "regularUser");

      const response = await page.request.post(
        `/api/datasets/${DATASET_WITH_VARIABLESETS_ID}/splitvariables/${PLACEHOLDER_VARIABLE_ID}`
      );
      expect(response.status()).toBe(401);
    });

    test("allows access for admin without organization memberships", async ({ browser }) => {
      await withUserPage(browser, "adminInNoOrg", async (page) => {
        const variableId = await getAvailableVariableId(page);
        let created = false;
        let cleanupError: string | null = null;

        try {
          const response = await page.request.post(
            `/api/datasets/${DATASET_WITH_VARIABLESETS_ID}/splitvariables/${variableId}`
          );
          expect(response.status()).toBe(200);

          const data = await response.json();
          expect(data.datasetId).toBe(DATASET_WITH_VARIABLESETS_ID);
          expect(data.variableId).toBe(variableId);
          created = true;
        } finally {
          if (created) {
            const cleanupResponse = await page.request.delete(
              `/api/datasets/${DATASET_WITH_VARIABLESETS_ID}/splitvariables/${variableId}`
            );

            if (cleanupResponse.status() !== 200) {
              cleanupError = `Failed to clean up split variable ${variableId}`;
            }
          }
        }

        if (cleanupError) {
          throw new Error(cleanupError);
        }
      });
    });
  });

  test.describe("DELETE /api/datasets/:id/splitvariables/:variableId", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.delete(
        `/api/datasets/${DATASET_WITH_VARIABLESETS_ID}/splitvariables/${PLACEHOLDER_VARIABLE_ID}`
      );
      expect(response.status()).toBe(401);
    });

    test("denies access for user with no organization", async ({ page }) => {
      await loginAs(page, "accountInNoOrg");

      const response = await page.request.delete(
        `/api/datasets/${DATASET_WITH_VARIABLESETS_ID}/splitvariables/${PLACEHOLDER_VARIABLE_ID}`
      );
      expect(response.status()).toBe(401);
    });

    test("denies access for regular user with dataset access", async ({ page }) => {
      await loginAs(page, "regularUser");

      const response = await page.request.delete(
        `/api/datasets/${DATASET_WITH_VARIABLESETS_ID}/splitvariables/${PLACEHOLDER_VARIABLE_ID}`
      );
      expect(response.status()).toBe(401);
    });

    test("allows access for admin without organization memberships", async ({ browser }) => {
      await withUserPage(browser, "adminInNoOrg", async (page) => {
        const variableId = await getAvailableVariableId(page);

        const createResponse = await page.request.post(
          `/api/datasets/${DATASET_WITH_VARIABLESETS_ID}/splitvariables/${variableId}`
        );
        expect(createResponse.status()).toBe(200);

        const response = await page.request.delete(
          `/api/datasets/${DATASET_WITH_VARIABLESETS_ID}/splitvariables/${variableId}`
        );
        expect(response.status()).toBe(200);
        expect(await response.json()).toEqual({ success: true });
      });
    });
  });
});
