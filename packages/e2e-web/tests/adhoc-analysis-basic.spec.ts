import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Adhoc Analysis - Basic Functionality", () => {
  test("should navigate to adhoc analysis and select SPSS Beispielumfrage dataset", async ({ page }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to adhoc analysis
    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Click dataset dropdown trigger
    await page.getByTestId("app.dropdown.dataset.trigger").click();

    // Select "SPSS Beispielumfrage" dataset - MUST exist from seed
    await page.getByText("SPSS Beispielumfrage").click();

    // Verify dataset is selected
    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTrigger).toContainText("SPSS Beispielumfrage");
  });

  test("should expand Demografische Daten group and display variables", async ({ page }) => {
    // Setup: Login and select dataset
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/project/test-project/adhoc");
    await page.getByTestId("app.dropdown.dataset.trigger").click();
    await page.getByText("SPSS Beispielumfrage").click();

    // Assert "Demografische Daten" group exists (seeded deterministically)
    const demografischeGroup = page.getByTestId("variable-group-Demografische Daten");
    await expect(demografischeGroup).toBeVisible();

    // Expand the group using the expand button
    const expandButton = page.getByTestId("variable-group-expand-Demografische Daten");
    await expandButton.click();

    // Assert specific variables are visible (using labels from SPSS metadata)
    await expect(page.getByTestId("variable-item-Alter")).toBeVisible();
    await expect(page.getByTestId("variable-item-Geschlecht")).toBeVisible();
    await expect(page.getByTestId("variable-item-Familienstand")).toBeVisible();
  });

  test("should select Geschlecht variable and display analysis chart", async ({ page }) => {
    // Setup: Login, select dataset, expand group
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/project/test-project/adhoc");
    await page.getByTestId("app.dropdown.dataset.trigger").click();
    await page.getByText("SPSS Beispielumfrage").click();

    // Expand the group using the expand button
    const expandButton = page.getByTestId("variable-group-expand-Demografische Daten");
    await expandButton.click();

    // Select Geschlecht variable (categorical - deterministic)
    const geschlechtVariable = page.getByTestId("variable-item-Geschlecht");
    await expect(geschlechtVariable).toBeVisible();
    await geschlechtVariable.click();

    // Assert that a chart is displayed
    // Use a more flexible selector that will match any visible chart
    await expect(page.locator("canvas, svg").first()).toBeVisible({ timeout: 10000 });
  });
});
