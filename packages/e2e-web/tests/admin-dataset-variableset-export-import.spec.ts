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
  category?: "general" | "multi_response" | "matrix";
  attributes?: {
    multiResponse?: {
      type: "dichotomies" | "categories";
      countedValue: number;
    };
  } | null;
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
    // Get a dataset with variable sets by calling the API as admin
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    const response = await page.request.get("/api/datasets");
    const data = await response.json();

    expect(data.rows).toBeDefined();
    expect(data.rows.length).toBeGreaterThan(0);

    // Find a dataset that has variable sets by checking each one
    let foundDatasetId: string | null = null;
    for (const dataset of data.rows) {
      const vsResponse = await page.request.get(`/api/datasets/${dataset.datasets.id}/variablesets/export`);
      if (vsResponse.status() === 200) {
        const exportData = await vsResponse.json();
        if (exportData.variableSets && exportData.variableSets.length > 0) {
          foundDatasetId = dataset.datasets.id;
          break;
        }
      }
    }

    expect(foundDatasetId).not.toBeNull();
    testDatasetId = foundDatasetId!;

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

      // Verify variableSets exist and have at least one item
      expect(exportData.variableSets).toBeDefined();
      expect(exportData.variableSets.length).toBeGreaterThan(0);

      // Verify each variableset has orderIndex
      for (const variableSet of exportData.variableSets) {
        expect(variableSet.orderIndex).toBeDefined();
        expect(typeof variableSet.orderIndex).toBe("number");
      }
    });

    test("export includes orderIndex for variables within variablesets", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      expect(response.status()).toBe(200);

      const exportData = (await response.json()) as ExportData;

      // Verify variableSets exist and have at least one item
      expect(exportData.variableSets).toBeDefined();
      expect(exportData.variableSets.length).toBeGreaterThan(0);

      // Find a variableSet with variables
      const setWithVariables = exportData.variableSets.find((vs) => vs.variables && vs.variables.length > 0);
      expect(setWithVariables).toBeDefined();
      expect(setWithVariables!.variables.length).toBeGreaterThan(0);

      // Verify each variable has orderIndex
      for (const variable of setWithVariables!.variables) {
        expect(variable.orderIndex).toBeDefined();
        expect(typeof variable.orderIndex).toBe("number");
      }
    });

    test("export sorts variables by orderIndex", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      expect(response.status()).toBe(200);

      const exportData = (await response.json()) as ExportData;

      // Verify variableSets exist and have at least one item
      expect(exportData.variableSets).toBeDefined();
      expect(exportData.variableSets.length).toBeGreaterThan(0);

      // Find a variableSet with multiple variables
      const setWithMultipleVars = exportData.variableSets.find((vs) => vs.variables && vs.variables.length > 1);
      expect(setWithMultipleVars).toBeDefined();
      expect(setWithMultipleVars!.variables.length).toBeGreaterThan(1);

      // Verify variables are sorted by orderIndex
      const orderIndices = setWithMultipleVars!.variables.map((v) => v.orderIndex);
      // Check if array is sorted in ascending order
      for (let i = 0; i < orderIndices.length - 1; i++) {
        expect(orderIndices[i]).toBeLessThanOrEqual(orderIndices[i + 1]);
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

      // Verify variablesets exist
      expect(exportData.variableSets).toBeDefined();
      expect(exportData.variableSets.length).toBeGreaterThan(0);

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
      expect(importedSets.length).toBe(modifiedExport.variableSets.length);

      // Verify orderIndex is preserved for each imported set
      for (const originalSet of modifiedExport.variableSets) {
        const importedSet = importedSets.find((vs) => vs.name === originalSet.name);
        expect(importedSet).toBeDefined();
        expect(importedSet!.orderIndex).toBe(originalSet.orderIndex);
      }
    });

    test("import preserves variable orderIndex within variablesets", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      // First, export the variablesets
      const exportResponse = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      expect(exportResponse.status()).toBe(200);
      const exportData = (await exportResponse.json()) as ExportData;

      // Find a variableset with variables
      const setsWithVariables = exportData.variableSets.filter((vs) => vs.variables && vs.variables.length > 0);
      expect(setsWithVariables.length).toBeGreaterThan(0);

      // Take the first variableset with variables and rename it
      const originalSet = setsWithVariables[0];
      expect(originalSet).toBeDefined();
      expect(originalSet.variables.length).toBeGreaterThan(0);

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
      expect(importedSet!.variables.length).toBe(originalSet.variables.length);

      // Verify each variable's orderIndex matches
      for (const originalVar of originalSet.variables) {
        const importedVar = importedSet!.variables.find((v) => v.name === originalVar.name);
        expect(importedVar).toBeDefined();
        expect(importedVar!.orderIndex).toBe(originalVar.orderIndex);
      }

      // Also verify that variables are in the same order
      const originalNames = originalSet.variables.map((v) => v.name);
      const importedNames = importedSet!.variables.map((v) => v.name);
      expect(importedNames).toEqual(originalNames);
    });

    test("import handles version 2.0 format correctly", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      // First get existing variables from the dataset to use in the test
      const existingExportResponse = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      expect(existingExportResponse.status()).toBe(200);
      const existingExportData = (await existingExportResponse.json()) as ExportData;

      // Find a variableset with at least 3 variables to use in our test
      const setWithVars = existingExportData.variableSets.find((vs) => vs.variables && vs.variables.length >= 3);
      expect(setWithVars).toBeDefined();
      expect(setWithVars!.variables.length).toBeGreaterThanOrEqual(3);

      // Take the first 3 variables and reorder them
      const variables = setWithVars!.variables.slice(0, 3);

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
                name: variables[0].name,
                orderIndex: 2,
              },
              {
                name: variables[1].name,
                orderIndex: 0,
              },
              {
                name: variables[2].name,
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

      expect(importResponse.status()).toBe(200);
      const importResult = await importResponse.json();

      expect(importResult.success).toBe(true);
      expect(importResult.summary.createdSets).toBe(1);

      // Verify the imported data
      const verifyExportResponse = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      const verifyExportData = (await verifyExportResponse.json()) as ExportData;

      const importedSet = verifyExportData.variableSets.find((vs) => vs.name === "Test_V2_Format");
      expect(importedSet).toBeDefined();
      expect(importedSet!.orderIndex).toBe(100);

      // Verify variables are sorted by their orderIndex
      const variableNames = importedSet!.variables.map((v) => v.name);
      expect(variableNames[0]).toBe(variables[1].name); // orderIndex 0
      expect(variableNames[1]).toBe(variables[2].name); // orderIndex 1
      expect(variableNames[2]).toBe(variables[0].name); // orderIndex 2
    });
  });

  test.describe("Category and Attributes Export/Import", () => {
    test("export includes category field", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      expect(response.status()).toBe(200);

      const exportData = (await response.json()) as ExportData;

      // Verify variableSets exist and have at least one item
      expect(exportData.variableSets).toBeDefined();
      expect(exportData.variableSets.length).toBeGreaterThan(0);

      // Verify each variableset has category field
      for (const variableSet of exportData.variableSets) {
        expect(variableSet.category).toBeDefined();
        expect(["general", "multi_response", "matrix"]).toContain(variableSet.category);
      }
    });

    test("import preserves category field", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      // First get existing variables from the dataset to use in the test
      const existingExportResponse = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      expect(existingExportResponse.status()).toBe(200);
      const existingExportData = (await existingExportResponse.json()) as ExportData;

      // Find a variableset with at least 1 variable to use in our test
      const setWithVars = existingExportData.variableSets.find((vs) => vs.variables && vs.variables.length >= 1);
      expect(setWithVars).toBeDefined();

      // Take the first variable
      const variables = setWithVars!.variables.slice(0, 1);

      // Create test data with different categories
      const testExport: ExportData = {
        metadata: {
          datasetId: testDatasetId,
          datasetName: "Test Dataset",
          exportedAt: new Date().toISOString(),
          version: "2.0",
        },
        variableSets: [
          {
            name: "Test_Category_General",
            description: "Testing general category",
            parentName: null,
            orderIndex: 200,
            category: "general",
            variables: [{ name: variables[0].name, orderIndex: 0 }],
          },
          {
            name: "Test_Category_MultiResponse",
            description: "Testing multi_response category",
            parentName: null,
            orderIndex: 201,
            category: "multi_response",
            attributes: {
              multiResponse: {
                type: "dichotomies",
                countedValue: 1,
              },
            },
            variables: [{ name: variables[0].name, orderIndex: 0 }],
          },
          {
            name: "Test_Category_Matrix",
            description: "Testing matrix category",
            parentName: null,
            orderIndex: 202,
            category: "matrix",
            variables: [{ name: variables[0].name, orderIndex: 0 }],
          },
        ],
      };

      const importResponse = await page.request.post(`/api/datasets/${testDatasetId}/variablesets/import`, {
        multipart: {
          file: {
            name: "category-test.json",
            mimeType: "application/json",
            buffer: Buffer.from(JSON.stringify(testExport)),
          },
        },
      });

      expect(importResponse.status()).toBe(200);
      const importResult = await importResponse.json();

      expect(importResult.success).toBe(true);
      expect(importResult.summary.createdSets).toBe(3);

      // Verify the imported data has correct categories
      const verifyExportResponse = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      const verifyExportData = (await verifyExportResponse.json()) as ExportData;

      const generalSet = verifyExportData.variableSets.find((vs) => vs.name === "Test_Category_General");
      expect(generalSet).toBeDefined();
      expect(generalSet!.category).toBe("general");

      const multiResponseSet = verifyExportData.variableSets.find((vs) => vs.name === "Test_Category_MultiResponse");
      expect(multiResponseSet).toBeDefined();
      expect(multiResponseSet!.category).toBe("multi_response");
      expect(multiResponseSet!.attributes).toBeDefined();
      expect(multiResponseSet!.attributes?.multiResponse).toBeDefined();
      expect(multiResponseSet!.attributes?.multiResponse?.type).toBe("dichotomies");
      expect(multiResponseSet!.attributes?.multiResponse?.countedValue).toBe(1);

      const matrixSet = verifyExportData.variableSets.find((vs) => vs.name === "Test_Category_Matrix");
      expect(matrixSet).toBeDefined();
      expect(matrixSet!.category).toBe("matrix");
    });

    test("import handles missing category field (backward compatibility)", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      // First get existing variables from the dataset to use in the test
      const existingExportResponse = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      expect(existingExportResponse.status()).toBe(200);
      const existingExportData = (await existingExportResponse.json()) as ExportData;

      // Find a variableset with at least 1 variable
      const setWithVars = existingExportData.variableSets.find((vs) => vs.variables && vs.variables.length >= 1);
      expect(setWithVars).toBeDefined();

      const variables = setWithVars!.variables.slice(0, 1);

      // Create an old-format export without category field
      const oldFormatExport = {
        metadata: {
          datasetId: testDatasetId,
          datasetName: "Test Dataset",
          exportedAt: new Date().toISOString(),
          version: "2.0",
        },
        variableSets: [
          {
            name: "Test_No_Category",
            description: "Testing backward compatibility",
            parentName: null,
            orderIndex: 300,
            // category field intentionally missing
            variables: [{ name: variables[0].name, orderIndex: 0 }],
          },
        ],
      };

      const importResponse = await page.request.post(`/api/datasets/${testDatasetId}/variablesets/import`, {
        multipart: {
          file: {
            name: "backward-compat.json",
            mimeType: "application/json",
            buffer: Buffer.from(JSON.stringify(oldFormatExport)),
          },
        },
      });

      expect(importResponse.status()).toBe(200);
      const importResult = await importResponse.json();

      expect(importResult.success).toBe(true);
      expect(importResult.summary.createdSets).toBe(1);

      // Verify the imported data defaults to "general" category
      const verifyExportResponse = await page.request.get(`/api/datasets/${testDatasetId}/variablesets/export`);
      const verifyExportData = (await verifyExportResponse.json()) as ExportData;

      const importedSet = verifyExportData.variableSets.find((vs) => vs.name === "Test_No_Category");
      expect(importedSet).toBeDefined();
      expect(importedSet!.category).toBe("general");
    });
  });
});
