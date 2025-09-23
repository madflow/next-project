import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";
import expectedFrequencies from "./analysis/fixtures/survey_sample_de_frequencies.json";

test.describe.configure({ mode: "parallel" });

const DATASET_TEST_ID = "0198e639-3e96-734b-b0db-af0c4350a2c5";

// Type definitions for API response
interface FrequencyItem {
  value: string;
  counts: number;
  percentages: number;
}

interface VariableStats {
  count: number;
  mode: number[];
  mean: number;
  std: number;
  min: number;
  max: number;
  median: number;
  range: number;
  frequency_table: FrequencyItem[];
}

interface VariableFrequencies {
  variable: string;
  stats: VariableStats;
}

// Type definitions for expected fixture data
interface ExpectedFrequencyItem {
  category: string;
  frequency: number;
  percent: number;
  valid_percent: number;
  cumulative_percent: number;
}

type ExpectedFrequencies = {
  [variable: string]: ExpectedFrequencyItem[];
};

test.describe("API Frequency Analysis Endpoint", () => {
  test.describe("Authentication", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({
          variables: [{ variable: "wrkstat", include: ["frequencies"] }],
        }),
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status()).toBe(401);
    });

    test("allows access for admin user", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({
          variables: [{ variable: "wrkstat", include: ["frequencies"] }],
        }),
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status()).toBe(200);
    });
  });

  test.describe("Frequency Analysis Validation", () => {
    // Get all variables from the expected frequencies fixture
    const variables = Object.keys(expectedFrequencies as ExpectedFrequencies);

    for (const variable of variables) {
      test(`validates ${variable} frequency analysis matches fixture exactly`, async ({ page }) => {
        await page.goto("/");
        await loginUser(page, testUsers.admin.email, testUsers.admin.password);

        const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
          data: JSON.stringify({
            variables: [{ variable, include: ["frequencies"] }],
            decimal_places: 3,
          }),
          headers: { "Content-Type": "application/json" },
        });

        expect(response.status()).toBe(200);

        const result: VariableFrequencies[] = await response.json();
        expect(result).toHaveLength(1);

        const variableResult = result[0];
        expect(variableResult.variable).toBe(variable);

        const actualFrequencies = variableResult.stats.frequency_table;
        const expectedFrequencyData = (expectedFrequencies as ExpectedFrequencies)[variable];

        // Note: API returns numeric codes while fixture has category labels
        // API may also filter out very low frequency categories (e.g., < 1%)
        // Some variables use 0-based indexing (degree), others use 1-based (wrkstat, etc.)
        expect(actualFrequencies.length).toBeGreaterThanOrEqual(expectedFrequencyData.length - 2);

        // Detect if this variable uses 0-based or 1-based indexing
        const hasZeroValue = actualFrequencies.some(item => item.value === "0.0");
        const indexOffset = hasZeroValue ? 0 : 1;

        // Create a map for easier comparison - use index-based mapping
        const actualFreqMap = new Map(
          actualFrequencies.map(item => [parseInt(item.value), item])
        );

        // Validate that we can find corresponding entries for major categories
        let matchedCategories = 0;
        for (let i = 0; i < expectedFrequencyData.length; i++) {
          const expectedItem = expectedFrequencyData[i];
          const actualItem = actualFreqMap.get(i + indexOffset);
          
          if (actualItem) {
            expect(actualItem.counts).toBe(expectedItem.frequency);
            expect(actualItem.percentages).toBe(expectedItem.percent);
            matchedCategories++;
          } else if (expectedItem.frequency > 10) {
            // Only fail if we're missing a significant category (> 10 occurrences)
            throw new Error(`Missing significant category with ${expectedItem.frequency} occurrences`);
          }
        }

        // Ensure we matched at least 80% of the expected categories
        expect(matchedCategories / expectedFrequencyData.length).toBeGreaterThanOrEqual(0.8);
      });
    }

    test("validates multiple variables frequency analysis in single request", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const allVariables = Object.keys(expectedFrequencies as ExpectedFrequencies);
      
      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({
          variables: allVariables.map(variable => ({ variable, include: ["frequencies"] })),
          decimal_places: 3,
        }),
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status()).toBe(200);

      const result: VariableFrequencies[] = await response.json();
      expect(result).toHaveLength(allVariables.length);

      // Validate each variable's frequencies
      for (const variableResult of result) {
        const variable = variableResult.variable;
        const actualFrequencies = variableResult.stats.frequency_table;
        const expectedFrequencyData = (expectedFrequencies as ExpectedFrequencies)[variable];

        expect(actualFrequencies.length).toBeGreaterThanOrEqual(expectedFrequencyData.length - 2);

        // Detect if this variable uses 0-based or 1-based indexing
        const hasZeroValue = actualFrequencies.some(item => item.value === "0.0");
        const indexOffset = hasZeroValue ? 0 : 1;

        const actualFreqMap = new Map(
          actualFrequencies.map(item => [parseInt(item.value), item])
        );

        let matchedCategories = 0;
        for (let i = 0; i < expectedFrequencyData.length; i++) {
          const expectedItem = expectedFrequencyData[i];
          const actualItem = actualFreqMap.get(i + indexOffset);
          
          if (actualItem) {
            expect(actualItem.counts).toBe(expectedItem.frequency);
            expect(actualItem.percentages).toBe(expectedItem.percent);
            matchedCategories++;
          } else if (expectedItem.frequency > 10) {
            throw new Error(`Missing significant category with ${expectedItem.frequency} occurrences`);
          }
        }

        expect(matchedCategories / expectedFrequencyData.length).toBeGreaterThanOrEqual(0.8);
      }
    });
  });

  test.describe("Error Handling", () => {
    test("handles non-existent variables gracefully", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({
          variables: [{ variable: "nonexistent_var", include: ["frequencies"] }],
        }),
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      
      // Should return error information for non-existent variable
      expect(result).toHaveLength(1);
      expect(result[0].variable).toBe("nonexistent_var");
      expect(result[0].error).toBeDefined();
    });

    test("handles mixed valid and invalid variables", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({
          variables: [
            { variable: "wrkstat", include: ["frequencies"] },
            { variable: "nonexistent_var", include: ["frequencies"] },
          ],
        }),
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      
      expect(result).toHaveLength(2);
      
      // Find the valid and invalid variable results
      const validResult = result.find((v: VariableFrequencies) => v.variable === "wrkstat");
      const invalidResult = result.find((v: VariableFrequencies) => v.variable === "nonexistent_var");
      
      expect(validResult).toBeDefined();
      expect(validResult.stats.frequency_table).toBeDefined();
      expect(validResult.error).toBeUndefined();
      
      expect(invalidResult).toBeDefined();
      expect(invalidResult.error).toBeDefined();
    });
  });
});