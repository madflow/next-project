import { Page, expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";
import surveyFrequencies from "./analysis/fixtures/survey_sample_de_frequencies.json";

test.describe.configure({ mode: "parallel" });

const DATASET_TEST_ID = "0198e639-3e96-734b-b0db-af0c4350a2c5";

async function fetchApiVariableStats(variables: string[], decimals: number, page: Page) {
  const variablesList = variables.map((v) => {
    return { variable: v };
  });
  const requestPayload = { variables: variablesList, decimal_places: decimals };
  const response = await page.request.post(`/api/datasets/${DATASET_TEST_ID}/stats`, {
    data: JSON.stringify(requestPayload),
    headers: { "Content-Type": "application/json" },
  });
  return await response.json();
}

test.describe("API Stats Endpoint with Frequencies", () => {
  test("returns correct Frequencies for all fixture variables", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    const variables = Object.keys(surveyFrequencies);
    const statsResponse = await fetchApiVariableStats(variables, 1, page);

    expect(Array.isArray(statsResponse)).toBe(true);
    expect(statsResponse.length).toBe(variables.length);

    for (const variable of variables) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiResult = statsResponse.find((item: any) => item.variable === variable);
      expect(apiResult).toBeDefined();
      expect(apiResult.stats).toBeDefined();
      expect(apiResult.stats.frequency_table).toBeDefined();

      // Compare the actual values from API with fixture data
      const fixtureData = surveyFrequencies[variable as keyof typeof surveyFrequencies];
      expect(apiResult.stats.count, `Count mismatch for variable: ${variable}`).toBe(fixtureData.count);

      const expectedFrequencies = fixtureData.frequency_table;
      const actualFrequencies = apiResult.stats.frequency_table;
      for (const expectedFreq of expectedFrequencies) {
        const actualFreq = actualFrequencies.find((af: { value: string }) => af.value === expectedFreq.value);
        expect(actualFreq.counts).toBe(expectedFreq.counts);
        expect(actualFreq.percentages).toBeCloseTo(expectedFreq.percentages, 1);
      }
    }
  });
});
