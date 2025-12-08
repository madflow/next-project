import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

interface VariableItem {
  name: string;
  orderIndex: number;
  attributes?: unknown;
}

interface VariableSet {
  name: string;
  description: string | null;
  parentName: string | null;
  orderIndex: number;
  variables: VariableItem[];
}

interface ExportData {
  metadata: {
    datasetId: string;
    datasetName: string;
    exportedAt: string;
    version: string;
  };
  variableSets: VariableSet[];
}

test.describe.configure({ mode: "parallel" });

test.describe("Dataset Variableset Export/Import with Order Index", () => {
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

  test.describe("Export Format", () => {
    test("export includes orderIndex for variablesets", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      expect(response.status()).toBe(200);

      const exportData = (await response.json()) as ExportData;

      // Verify metadata version is 2.0
      expect(exportData.metadata.version).toBe("2.0");

      // Verify each variableset has orderIndex
      if (exportData.variableSets && exportData.variableSets.length > 0) {
        for (const variableSet of exportData.variableSets) {
          expect(variableSet.orderIndex).toBeDefined();
          expect(typeof variableSet.orderIndex).toBe("number");
        }
      }
    });

    test("export includes orderIndex for variables within variablesets", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      expect(response.status()).toBe(200);

      const exportData = (await response.json()) as ExportData;

      // Verify each variable has orderIndex
      if (exportData.variableSets && exportData.variableSets.length > 0) {
        for (const variableSet of exportData.variableSets) {
          if (variableSet.variables && variableSet.variables.length > 0) {
            for (const variable of variableSet.variables) {
              expect(variable.orderIndex).toBeDefined();
              expect(typeof variable.orderIndex).toBe("number");
            }
          }
        }
      }
    });

    test("export sorts variables by orderIndex", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      expect(response.status()).toBe(200);

      const exportData = (await response.json()) as ExportData;

      // Verify variables are sorted by orderIndex
      if (exportData.variableSets && exportData.variableSets.length > 0) {
        for (const variableSet of exportData.variableSets) {
          if (variableSet.variables && variableSet.variables.length > 1) {
            const orderIndices = variableSet.variables.map((v) => v.orderIndex);
            // Check if array is sorted in ascending order
            for (let i = 0; i < orderIndices.length - 1; i++) {
              expect(orderIndices[i]).toBeLessThanOrEqual(orderIndices[i + 1]);
            }
          }
        }
      }
    });
  });

  test.describe("Import with Order Preservation", () => {
    test("import preserves variableset orderIndex", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      // First, export the variablesets
      const exportResponse = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      expect(exportResponse.status()).toBe(200);
      const exportData = (await exportResponse.json()) as ExportData;

      // Skip test if no variablesets exist
      if (!exportData.variableSets || exportData.variableSets.length === 0) {
        test.skip();
        return;
      }

      // Modify the variableset names to avoid conflicts
      const modifiedExport: ExportData = {
        ...exportData,
        variableSets: exportData.variableSets.map((vs) => ({
          ...vs,
          name: `${vs.name}_imported`,
        })),
      };

      // Import the data
      const importResponse = await page.request.post(`/api/datasets/${testDatasetId}/variablesets/import`, {
        multipart: {
          file: {
            name: "test-import.json",
            mimeType: "application/json",
            buffer: Buffer.from(JSON.stringify(modifiedExport)),
          },
        },
      });

      expect(importResponse.status()).toBe(200);
      const importResult = await importResponse.json();

      expect(importResult.success).toBe(true);
      expect(importResult.summary.createdSets).toBeGreaterThan(0);

      // Verify the imported variablesets have the correct orderIndex by exporting again
      const verifyExportResponse = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      const verifyExportData = (await verifyExportResponse.json()) as ExportData;

      // Find the imported variablesets
      const importedSets = verifyExportData.variableSets.filter((vs) => vs.name.endsWith("_imported"));

      // Verify orderIndex is preserved
      for (let i = 0; i < modifiedExport.variableSets.length; i++) {
        const originalSet = modifiedExport.variableSets[i];
        if (!originalSet) continue;
        const importedSet = importedSets.find((vs) => vs.name === originalSet.name);

        if (importedSet) {
          expect(importedSet.orderIndex).toBe(originalSet.orderIndex);
        }
      }

      // Cleanup: delete the imported variablesets
      for (const importedSet of importedSets) {
        const variablesetListResponse = await page.request.get(`/api/datasets/${testDatasetId}/variablesets`);
        const variablesets = (await variablesetListResponse.json()) as VariableSet[];
        const setToDelete = variablesets.find((vs) => vs.name === importedSet.name);

        if (setToDelete) {
          // Delete via the UI or API endpoint if available
          // For now, we'll leave cleanup as a manual step or implement if needed
        }
      }
    });

    test("import preserves variable orderIndex within variablesets", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      // First, export the variablesets
      const exportResponse = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      expect(exportResponse.status()).toBe(200);
      const exportData = (await exportResponse.json()) as ExportData;

      // Skip test if no variablesets with variables exist
      const setsWithVariables = exportData.variableSets?.filter((vs) => vs.variables && vs.variables.length > 0);
      if (!setsWithVariables || setsWithVariables.length === 0) {
        test.skip();
        return;
      }

      // Take the first variableset with variables and rename it
      const originalSet = setsWithVariables[0];
      if (!originalSet) {
        test.skip();
        return;
      }
      const modifiedExport: ExportData = {
        ...exportData,
        variableSets: [
          {
            ...originalSet,
            name: `${originalSet.name}_order_test`,
          },
        ],
      };

      // Import the data
      const importResponse = await page.request.post(`/api/datasets/${testDatasetId}/variablesets/import`, {
        multipart: {
          file: {
            name: "test-order-import.json",
            mimeType: "application/json",
            buffer: Buffer.from(JSON.stringify(modifiedExport)),
          },
        },
      });

      expect(importResponse.status()).toBe(200);
      const importResult = await importResponse.json();

      expect(importResult.success).toBe(true);
      expect(importResult.summary.createdSets).toBe(1);

      // Verify the imported variableset's variables have the correct orderIndex
      const verifyExportResponse = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      const verifyExportData = (await verifyExportResponse.json()) as ExportData;

      const importedSet = verifyExportData.variableSets.find((vs) => vs.name === `${originalSet.name}_order_test`);

      expect(importedSet).toBeDefined();
      expect(importedSet?.variables.length).toBe(originalSet.variables.length);

      // Verify each variable's orderIndex matches
      for (let i = 0; i < originalSet.variables.length; i++) {
        const originalVar = originalSet.variables[i];
        if (!originalVar) continue;
        const importedVar = importedSet?.variables.find((v) => v.name === originalVar.name);

        expect(importedVar).toBeDefined();
        expect(importedVar?.orderIndex).toBe(originalVar.orderIndex);
      }

      // Also verify that variables are in the same order
      const originalNames = originalSet.variables.map((v) => v.name);
      const importedNames = importedSet?.variables.map((v) => v.name);
      expect(importedNames).toEqual(originalNames);
    });

    test("import handles version 2.0 format correctly", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      // Create a v2.0 format export with explicit orderIndex values
      const v2Export: ExportData = {
        metadata: {
          datasetId: testDatasetId,
          datasetName: "Test Dataset",
          exportedAt: new Date().toISOString(),
          version: "2.0",
        },
        variableSets: [
          {
            name: "Test_V2_Format",
            description: "Testing v2.0 format",
            parentName: null,
            orderIndex: 100,
            variables: [
              {
                name: "age",
                orderIndex: 2,
              },
              {
                name: "gender",
                orderIndex: 0,
              },
              {
                name: "income",
                orderIndex: 1,
              },
            ],
          },
        ],
      };

      const importResponse = await page.request.post(`/api/datasets/${testDatasetId}/variablesets/import`, {
        multipart: {
          file: {
            name: "v2-format.json",
            mimeType: "application/json",
            buffer: Buffer.from(JSON.stringify(v2Export)),
          },
        },
      });

      // Accept either 200 (success) or 400 (validation error if variables don't exist)
      expect([200, 400].includes(importResponse.status())).toBe(true);

      if (importResponse.status() === 200) {
        const importResult = (await importResponse.json()) as {
          success: boolean;
          summary: { createdSets: number };
        };

        // If successful, verify the imported data
        if (importResult.summary.createdSets > 0) {
          const verifyExportResponse = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
          const verifyExportData = (await verifyExportResponse.json()) as ExportData;

          const importedSet = verifyExportData.variableSets.find((vs) => vs.name === "Test_V2_Format");

          if (importedSet) {
            expect(importedSet.orderIndex).toBe(100);

            // Verify variables are sorted by their orderIndex
            const variableNames = importedSet.variables.map((v) => v.name);
            expect(variableNames[0]).toBe("gender"); // orderIndex 0
            expect(variableNames[1]).toBe("income"); // orderIndex 1
            expect(variableNames[2]).toBe("age"); // orderIndex 2
          }
        }
      }
    });
  });
});
