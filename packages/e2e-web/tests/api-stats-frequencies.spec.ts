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

    const variables = Object.keys(surveyFrequencies); // Get all variable names from fixture
    const statsResponse = await fetchApiVariableStats(variables, 1, page);
    console.log("Frequencies fixture:", JSON.stringify(surveyFrequencies, null, 2));
    console.log("Stats Response:", JSON.stringify(statsResponse, null, 2));
  });
});
