import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Adhoc Analysis - Matrix Variableset", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    await page.getByTestId("app.dropdown.dataset.trigger").click();
    await page.getByText("SPSS Beispielumfrage").click();
    await expect(page.getByTestId("app.dropdown.dataset.trigger")).toContainText("SPSS Beispielumfrage");
  });

  test("renders the shared scale and keeps individual question selection separate", async ({ page }) => {
    await page.getByTestId("variable-group-Zufriedenheit").click();

    const matrixChart = page.getByTestId("matrix-chart");
    await expect(matrixChart).toBeVisible({ timeout: 5000 });
    await expect(matrixChart).toContainText("Zufriedenheit");
    await expect(matrixChart).toContainText("Sehr zufrieden");
    await expect(matrixChart).toContainText("Ziemlich zufrieden");
    await expect(matrixChart).toContainText("Nicht sehr zufrieden");
    await expect(matrixChart).not.toContainText("NZ");
    await expect(matrixChart).not.toContainText("KA");
    await expect(matrixChart).not.toContainText("NA");
    await expect(matrixChart.locator(".recharts-bar-rectangle")).toHaveCount(6);

    await page.getByTestId("variable-item-happy").click();

    await expect(matrixChart).toHaveCount(0);
    await expect(page.locator(".recharts-wrapper").first()).toBeVisible({ timeout: 5000 });
  });
});
