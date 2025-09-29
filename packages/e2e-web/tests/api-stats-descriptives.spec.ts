import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";
import surveyResults from "./analysis/fixtures/survey_sample_de_descriptives.json";

test.describe.configure({ mode: "parallel" });

const DATASET_TEST_ID = "0198e639-3e96-734b-b0db-af0c4350a2c5";

// Type definitions for API response
interface VariableStats {
  variable: string;
  stats: {
    count: number;
    max: number;
    mean: number;
    median: number;
    min: number;
    std: number;
  };
}

test.describe("API Stats Endpoint", () => {
  test.describe("Authentication", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({ variables: [{ variable: "id" }] }),
        headers: { "Content-Type": "application/json" },
      });
      expect(response.status()).toBe(401);
    });

    test("denies access for user not in organization", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.accountInNoOrg.email, testUsers.accountInNoOrg.password);

      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({ variables: [{ variable: "id" }] }),
        headers: { "Content-Type": "application/json" },
      });
      expect(response.status()).toBe(401);
    });

    test("allows access for admin user", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({ variables: [{ variable: "id" }] }),
        headers: { "Content-Type": "application/json" },
      });
      expect(response.status()).toBe(200);
    });

    test("allows access for regular user in organization", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.regularUser.email, testUsers.regularUser.password);

      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({ variables: [{ variable: "id" }] }),
        headers: { "Content-Type": "application/json" },
      });
      expect(response.status()).toBe(200);
    });
  });

  test.describe("ID Variable Statistics", () => {
    test("returns correct statistics for ID variable", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({ variables: [{ variable: "id" }], decimal_places: 3 }),
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);

      const idStats = data.find((stat: VariableStats) => stat.variable === "id");
      expect(idStats).toBeDefined();
      expect(idStats.stats).toBeDefined();

      // Get expected values from fixture
      const expectedIdStats = surveyResults.descriptive_statistics.find((stat) => stat.variable === "id");
      expect(expectedIdStats).toBeDefined();

      // Verify all statistical measures match the fixture exactly
      expect(idStats.stats.max).toBe(expectedIdStats!.maximum);
      expect(idStats.stats.mean).toBe(expectedIdStats!.mean);
      expect(idStats.stats.median).toBe(expectedIdStats!.median);
      expect(idStats.stats.min).toBe(expectedIdStats!.minimum);
      expect(idStats.stats.std).toBe(expectedIdStats!.std_deviation);
      expect(idStats.variable).toBe(expectedIdStats!.variable);
    });

    test("returns only requested variables", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({ variables: [{ variable: "id" }], decimal_places: 3 }),
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveLength(1);
      expect(data[0].variable).toBe("id");
    });
  });

  test.describe("Multiple Variables", () => {
    test("returns statistics for multiple variables including ID", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({
          variables: [{ variable: "id" }, { variable: "age" }, { variable: "sex" }],
          decimal_places: 3,
        }),
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveLength(3);

      const variables = data.map((stat: VariableStats) => stat.variable);
      expect(variables).toContain("id");
      expect(variables).toContain("age");
      expect(variables).toContain("sex");

      // Verify ID statistics still match
      const idStats = data.find((stat: VariableStats) => stat.variable === "id");
      const expectedIdStats = surveyResults.descriptive_statistics.find((stat) => stat.variable === "id");
      expect(idStats.stats.max).toBe(expectedIdStats!.maximum);
      expect(idStats.stats.count).toBe(expectedIdStats!.valid);
    });

    test("returns statistics for all fixture variables", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      // Get all variable names from fixture
      const fixtureVariables = surveyResults.descriptive_statistics.map((stat) => ({ variable: stat.variable }));

      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({ variables: fixtureVariables, decimal_places: 3 }),
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.length).toBe(surveyResults.descriptive_statistics.length);

      // Verify each variable matches the fixture exactly
      for (const expectedStat of surveyResults.descriptive_statistics) {
        const actualStat = data.find((stat: VariableStats) => stat.variable === expectedStat.variable);
        expect(actualStat).toBeDefined();
        expect(actualStat.stats.max).toBe(expectedStat.maximum);
        expect(actualStat.stats.mean).toBe(expectedStat.mean);
        expect(actualStat.stats.median).toBe(expectedStat.median);
        expect(actualStat.stats.min).toBe(expectedStat.minimum);
        expect(actualStat.stats.std).toBe(expectedStat.std_deviation);
      }
    });
  });

  test.describe("Key Variables Validation", () => {
    test("validates age variable statistics", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({ variables: [{ variable: "age" }], decimal_places: 3 }),
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      const ageStats = data.find((stat: VariableStats) => stat.variable === "age");
      const expectedAgeStats = surveyResults.descriptive_statistics.find((stat) => stat.variable === "age");

      expect(ageStats.stats.max).toBe(expectedAgeStats!.maximum);
      expect(ageStats.stats.mean).toBe(expectedAgeStats!.mean);
      expect(ageStats.stats.min).toBe(expectedAgeStats!.minimum);
      expect(ageStats.stats.count).toBe(expectedAgeStats!.valid);
    });

    test("validates sex variable statistics", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({ variables: [{ variable: "sex" }], decimal_places: 3 }),
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      const sexStats = data.find((stat: VariableStats) => stat.variable === "sex");
      const expectedSexStats = surveyResults.descriptive_statistics.find((stat) => stat.variable === "sex");

      expect(sexStats.stats.max).toBe(expectedSexStats!.maximum);
      expect(sexStats.stats.mean).toBe(expectedSexStats!.mean);
      expect(sexStats.stats.min).toBe(expectedSexStats!.minimum);
      expect(sexStats.stats.count).toBe(expectedSexStats!.valid);
    });

    test("validates wrkstat variable statistics", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({ variables: [{ variable: "wrkstat" }] }),
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      const wrkstatStats = data.find((stat: VariableStats) => stat.variable === "wrkstat");
      const expectedWrkstatStats = surveyResults.descriptive_statistics.find((stat) => stat.variable === "wrkstat");

      expect(wrkstatStats.stats.max).toBe(expectedWrkstatStats!.maximum);
      expect(wrkstatStats.stats.mean).toBeCloseTo(expectedWrkstatStats!.mean, 2);
      expect(wrkstatStats.stats.median).toBe(expectedWrkstatStats!.median);
      expect(wrkstatStats.stats.min).toBe(expectedWrkstatStats!.minimum);
      expect(wrkstatStats.stats.std).toBeCloseTo(expectedWrkstatStats!.std_deviation, 2);
      expect(wrkstatStats.stats.count).toBe(expectedWrkstatStats!.valid);
      expect(wrkstatStats.variable).toBe(expectedWrkstatStats!.variable);
    });

    test("validates variables with missing values", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      // Test variables that have missing values according to fixture
      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({
          variables: [{ variable: "wrkstat" }, { variable: "marital" }, { variable: "childs" }],
          decimal_places: 3,
        }),
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      const wrkstatStats = data.find((stat: VariableStats) => stat.variable === "wrkstat");
      const maritalStats = data.find((stat: VariableStats) => stat.variable === "marital");
      const childsStats = data.find((stat: VariableStats) => stat.variable === "childs");

      const expectedWrkstat = surveyResults.descriptive_statistics.find((stat) => stat.variable === "wrkstat");
      const expectedMarital = surveyResults.descriptive_statistics.find((stat) => stat.variable === "marital");
      const expectedChilds = surveyResults.descriptive_statistics.find((stat) => stat.variable === "childs");

      // Verify these variables have the correct basic statistics
      expect(wrkstatStats.stats.max).toBe(expectedWrkstat!.maximum);
      expect(maritalStats.stats.max).toBe(expectedMarital!.maximum);
      expect(childsStats.stats.max).toBe(expectedChilds!.maximum);

      // Verify the count matches valid count from fixture
      expect(wrkstatStats.stats.count).toBe(expectedWrkstat!.valid);
      expect(maritalStats.stats.count).toBe(expectedMarital!.valid);
      expect(childsStats.stats.count).toBe(expectedChilds!.valid);
    });
  });

  test.describe("Error Handling", () => {
    test("returns 500 for invalid dataset ID", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.post("/api/datasets/invalid-id/stats", {
        data: JSON.stringify({ variables: [{ variable: "id" }] }),
        headers: { "Content-Type": "application/json" },
      });

      // Should return 500 for invalid ID format (database error)
      expect(response.status()).toBe(500);
    });

    test("handles empty variables list", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({ variables: [] }),
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(0);
    });

    test("handles non-existent variables gracefully", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({ variables: [{ variable: "nonexistent_variable" }] }),
        headers: { "Content-Type": "application/json" },
      });

      // API should return 200 with error objects for non-existent variables
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(1);
      expect(data[0]).toHaveProperty("error");
      expect(data[0].variable).toBe("nonexistent_variable");
    });

    test("handles malformed request body", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: "invalid json",
        headers: { "Content-Type": "application/json" },
      });

      // Analysis service handles malformed JSON gracefully with 200 + error details
      expect(response.status()).toBe(200);
    });

    test("handles missing Content-Type header", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({ variables: [{ variable: "id" }] }),
      });

      // Should still work without Content-Type header
      expect(response.status()).toBe(200);
    });
  });

  test.describe("Response Schema Validation", () => {
    test("returns correct response structure", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
        data: JSON.stringify({ variables: [{ variable: "id" }], decimal_places: 3 }),
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);

      if (data.length > 0) {
        const stat = data[0];
        expect(stat).toHaveProperty("variable");
        expect(stat).toHaveProperty("stats");

        const stats = stat.stats;
        expect(stats).toHaveProperty("max");
        expect(stats).toHaveProperty("mean");
        expect(stats).toHaveProperty("median");
        expect(stats).toHaveProperty("min");
        expect(stats).toHaveProperty("std");
        expect(stats).toHaveProperty("range");
        expect(stats).toHaveProperty("count");

        expect(typeof stat.variable).toBe("string");
        expect(typeof stats.max).toBe("number");
        expect(typeof stats.mean).toBe("number");
        expect(typeof stats.median).toBe("number");
        expect(typeof stats.min).toBe("number");
        expect(typeof stats.std).toBe("number");
        expect(typeof stats.range).toBe("number");
        expect(typeof stats.count).toBe("number");
      }
    });
  });
});

