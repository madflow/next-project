import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe.configure({ mode: "parallel" });

test.describe("API Dataset Variable Sets", () => {
  let testDatasetId: string;

  test.beforeAll(async ({ browser }) => {
    // Get an existing dataset ID by calling the API as admin
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    const response = await page.request.get("/api/datasets?limit=1");
    const data = await response.json();

    if (data.rows && data.rows.length > 0) {
      testDatasetId = data.rows[0].id;
    } else {
      throw new Error("No datasets found in test environment");
    }

    await context.close();
  });

  test.describe("Export Endpoint Authentication", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      expect(response.status()).toBe(401);
    });

    test("denies access for regular user", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.regularUser.email, testUsers.regularUser.password);
      const response = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      expect(response.status()).toBe(401);
    });

    test("denies access for user with no organization", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.accountInNoOrg.email, testUsers.accountInNoOrg.password);
      const response = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      expect(response.status()).toBe(401);
    });

    test("allows access for admin user", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);
      const response = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      expect(response.status()).toBe(200);

      // Verify response headers for JSON export
      const contentType = response.headers()["content-type"];
      expect(contentType).toContain("application/json");
    });

    test("returns 404 for non-existent dataset", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);
      const response = await page.request.get("/api/datasets/00000000-0000-0000-0000-000000000000/variablesets/export");
      // Export endpoint explicitly checks dataset existence and returns 404
      expect(response.status()).toBe(404);
    });
  });

  test.describe("Import Endpoint Authentication", () => {
    test("denies access when not logged in", async ({ page }) => {
      // Create a simple JSON data for import
      const importData = JSON.stringify({
        variableSets: [
          {
            name: "Test Set",
            description: "Test Description",
            variables: ["var1", "var2"],
          },
        ],
      });

      const formData = new FormData();
      const blob = new Blob([importData], { type: "application/json" });
      formData.append("file", blob, "test-variablesets.json");

      const response = await page.request.post(`/api/datasets/${testDatasetId}/variablesets/import`, {
        multipart: {
          file: {
            name: "test-variablesets.json",
            mimeType: "application/json",
            buffer: Buffer.from(importData),
          },
        },
      });
      expect(response.status()).toBe(401);
    });

    test("denies access for regular user", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.regularUser.email, testUsers.regularUser.password);

      const importData = JSON.stringify({
        variableSets: [
          {
            name: "Test Set",
            description: "Test Description",
            variables: ["var1", "var2"],
          },
        ],
      });

      const response = await page.request.post(`/api/datasets/${testDatasetId}/variablesets/import`, {
        multipart: {
          file: {
            name: "test-variablesets.json",
            mimeType: "application/json",
            buffer: Buffer.from(importData),
          },
        },
      });
      expect(response.status()).toBe(401);
    });

    test("denies access for user with no organization", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.accountInNoOrg.email, testUsers.accountInNoOrg.password);

      const importData = JSON.stringify({
        variableSets: [
          {
            name: "Test Set",
            description: "Test Description",
            variables: ["var1", "var2"],
          },
        ],
      });

      const response = await page.request.post(`/api/datasets/${testDatasetId}/variablesets/import`, {
        multipart: {
          file: {
            name: "test-variablesets.json",
            mimeType: "application/json",
            buffer: Buffer.from(importData),
          },
        },
      });
      expect(response.status()).toBe(401);
    });

    test("allows access for admin user", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const importData = JSON.stringify({
        variableSets: [
          {
            name: "Test Import Set",
            description: "Test import description",
            variables: ["age", "gender"], // Use variables that likely exist in demo.sav
          },
        ],
      });

      const response = await page.request.post(`/api/datasets/${testDatasetId}/variablesets/import`, {
        multipart: {
          file: {
            name: "test-variablesets.json",
            mimeType: "application/json",
            buffer: Buffer.from(importData),
          },
        },
      });

      // Should return 200 for successful import or 400 for validation errors (which is still authenticated access)
      expect([200, 400].includes(response.status())).toBe(true);
    });

    test("returns 400 for non-existent dataset", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const importData = JSON.stringify({
        variableSets: [
          {
            name: "Test Set",
            description: "Test Description",
            variables: ["var1", "var2"],
          },
        ],
      });

      const response = await page.request.post(
        "/api/datasets/00000000-0000-0000-0000-000000000000/variablesets/import",
        {
          multipart: {
            file: {
              name: "test-variablesets.json",
              mimeType: "application/json",
              buffer: Buffer.from(importData),
            },
          },
        }
      );
      // Import endpoint's assertAccess error gets converted differently due to form parsing
      expect(response.status()).toBe(400);
    });

    test("returns 400 for invalid file format", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const invalidData = "invalid json data";

      const response = await page.request.post(`/api/datasets/${testDatasetId}/variablesets/import`, {
        multipart: {
          file: {
            name: "invalid.txt",
            mimeType: "text/plain",
            buffer: Buffer.from(invalidData),
          },
        },
      });
      expect(response.status()).toBe(400);
    });
  });
});
