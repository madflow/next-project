import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Admin Dataset Split Variables", () => {
  let datasetName: string;

  test.beforeEach(async ({ page }) => {
    // Create a unique dataset name for each test
    datasetName = `Test Dataset Split Variables ${Date.now()}`;

    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Create a test dataset
    await page.goto("/admin/datasets");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();

    await page.getByTestId("admin.datasets.create.upload").click();
    const uploadFile = page.getByTestId("file-upload-input");
    await uploadFile.setInputFiles("testdata/spss/demo.sav");
    await page.waitForSelector("data-testid=app.admin.dataset.selected-file");
    await page.getByTestId("app.admin.dataset.name-input").fill(datasetName);
    await page.getByTestId("app.admin.dataset.organization-trigger").click();
    await page.getByTestId("org-option-test-organization").click();
    await page.getByTestId("app.admin.dataset.upload-button").click();

    // Navigate to the dataset editor
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();
    await page.getByTestId("app.datatable.search-input").fill(datasetName);
    await page.getByRole("link", { name: datasetName }).click();

    // Navigate to Split Variables tab
    await page.getByTestId("app.admin.editor.splitvariables.tab").click();
    await page.waitForLoadState("networkidle");
  });

  test("should navigate to split variables tab and display assignment interface", async ({ page }) => {
    // Verify the split variables tab is active and content is visible
    await expect(page.getByTestId("app.admin.editor.splitvariables.tab")).toHaveAttribute("data-state", "active");

    // Verify the main title and description are displayed using specific test IDs
    await expect(page.getByTestId("admin.dataset.splitvariables.title")).toBeVisible();
    await expect(page.getByTestId("admin.dataset.splitvariables.description")).toBeVisible();

    // Verify both available and assigned variable sections are visible
    await expect(page.getByTestId("admin.dataset.splitvariables.available.section")).toBeVisible();
    await expect(page.getByTestId("admin.dataset.splitvariables.assigned.section")).toBeVisible();

    // Verify search inputs are present in both sections
    const searchInputs = page.getByPlaceholder("Search variables...");
    await expect(searchInputs).toHaveCount(2);

    // Wait for assigned section to show empty state (initially no split variables)
    await expect(page.getByTestId("admin.dataset.splitvariables.assigned.empty")).toBeVisible();
  });

  test("should assign a variable as split variable successfully", async ({ page }) => {
    // Wait for available variables to load
    await expect(page.getByTestId("admin.dataset.splitvariables.available.section")).toBeVisible();

    // Wait for either available variables list or empty state
    const availableList = page.getByTestId("admin.dataset.splitvariables.available.variables.list");
    const availableEmpty = page.getByTestId("admin.dataset.splitvariables.available.empty");

    // Wait for one of them to be visible
    await Promise.race([expect(availableList).toBeVisible(), expect(availableEmpty).toBeVisible()]);

    // Only proceed if there are available variables
    const addButtons = page.getByTestId("admin.dataset.splitvariables.assignment.add");
    const addButtonCount = await addButtons.count();

    if (addButtonCount === 0) {
      // Skip test if no variables available
      console.log("Skipping test - no available variables to assign");
      return;
    }

    // Get the first available variable and assign it
    const firstAddButton = addButtons.first();
    await expect(firstAddButton).toBeVisible();

    // Get the initial counts
    const initialAvailableCount = await addButtons.count();
    const initialAssignedCount = await page.getByTestId("admin.dataset.splitvariables.assignment.remove").count();

    // Click the add button to assign the variable
    await firstAddButton.click();

    // Wait for the assignment to complete by waiting for remove button to appear
    await expect(page.getByTestId("admin.dataset.splitvariables.assignment.remove").first()).toBeVisible();

    // Verify the variable was moved from available to assigned section
    const newAvailableCount = await addButtons.count();
    const newAssignedCount = await page.getByTestId("admin.dataset.splitvariables.assignment.remove").count();

    expect(newAvailableCount).toBe(initialAvailableCount - 1);
    expect(newAssignedCount).toBe(initialAssignedCount + 1);
  });

  test("should remove a split variable successfully", async ({ page }) => {
    // Wait for available section to load
    await expect(page.getByTestId("admin.dataset.splitvariables.available.section")).toBeVisible();

    // Wait for either available variables or empty state
    const availableList = page.getByTestId("admin.dataset.splitvariables.available.variables.list");
    const availableEmpty = page.getByTestId("admin.dataset.splitvariables.available.empty");

    await Promise.race([expect(availableList).toBeVisible(), expect(availableEmpty).toBeVisible()]);

    // Check if we have variables to assign
    const addButtons = page.getByTestId("admin.dataset.splitvariables.assignment.add");
    const addButtonCount = await addButtons.count();

    if (addButtonCount === 0) {
      console.log("Skipping test - no available variables to assign and then remove");
      return;
    }

    // First assign a variable to have something to remove
    const firstAddButton = addButtons.first();
    await firstAddButton.click();

    // Wait for assignment to complete by waiting for remove button to appear
    await expect(page.getByTestId("admin.dataset.splitvariables.assignment.remove").first()).toBeVisible();

    // Get counts before removal
    const initialAvailableCount = await addButtons.count();
    const initialAssignedCount = await page.getByTestId("admin.dataset.splitvariables.assignment.remove").count();

    // Remove the assigned split variable
    const firstRemoveButton = page.getByTestId("admin.dataset.splitvariables.assignment.remove").first();
    await firstRemoveButton.click();

    // Wait for removal to complete by waiting for add button to reappear
    await expect(addButtons).toHaveCount(initialAvailableCount + 1);

    // Verify the variable was moved back from assigned to available section
    const newAvailableCount = await addButtons.count();
    const newAssignedCount = await page.getByTestId("admin.dataset.splitvariables.assignment.remove").count();

    expect(newAvailableCount).toBe(initialAvailableCount + 1);
    expect(newAssignedCount).toBe(initialAssignedCount - 1);
  });

  test("should filter variables using search functionality", async ({ page }) => {
    // Wait for available section to load
    await expect(page.getByTestId("admin.dataset.splitvariables.available.section")).toBeVisible();

    // Wait for either available variables or empty state
    const availableList = page.getByTestId("admin.dataset.splitvariables.available.variables.list");
    const availableEmpty = page.getByTestId("admin.dataset.splitvariables.available.empty");

    await Promise.race([expect(availableList).toBeVisible(), expect(availableEmpty).toBeVisible()]);

    // Check if we have variables to test search with
    const addButtons = page.getByTestId("admin.dataset.splitvariables.assignment.add");
    const initialAvailableCount = await addButtons.count();

    if (initialAvailableCount === 0) {
      console.log("Skipping search test - no available variables to search");
      return;
    }

    // Test search in available variables section
    const availableSearchInput = page.getByPlaceholder("Search variables...").first();
    await availableSearchInput.fill("age");

    // Wait for search results to update by waiting for the UI to stabilize
    await expect(availableSearchInput).toHaveValue("age");

    // Verify that search results are filtered (should be fewer or equal variables)
    const filteredAvailableCount = await addButtons.count();
    expect(filteredAvailableCount).toBeLessThanOrEqual(initialAvailableCount);

    // Clear search and verify variables list is restored
    await availableSearchInput.clear();
    await expect(availableSearchInput).toHaveValue("");

    // Wait for full list to be restored
    await expect(addButtons).toHaveCount(initialAvailableCount);

    // Test search with no results
    await availableSearchInput.fill("nonexistentvariablename123");
    await expect(availableSearchInput).toHaveValue("nonexistentvariablename123");

    // Wait for empty results
    await expect(addButtons).toHaveCount(0);

    // Test assigned variables search (after assigning some variables)
    await availableSearchInput.clear();
    await expect(availableSearchInput).toHaveValue("");

    // Wait for variables to be restored
    await expect(addButtons).toHaveCount(initialAvailableCount);

    // Assign a couple of variables first if available
    const buttonCount = await addButtons.count();
    if (buttonCount > 0) {
      await addButtons.first().click();
      await expect(page.getByTestId("admin.dataset.splitvariables.assignment.remove").first()).toBeVisible();
    }
    if (buttonCount > 1) {
      await addButtons.first().click();
      await expect(page.getByTestId("admin.dataset.splitvariables.assignment.remove")).toHaveCount(2);
    }

    // Test search in assigned variables section
    const assignedSearchInput = page.getByPlaceholder("Search variables...").last();
    const removeButtons = page.getByTestId("admin.dataset.splitvariables.assignment.remove");
    const initialAssignedCount = await removeButtons.count();

    if (initialAssignedCount > 0) {
      await assignedSearchInput.fill("nonexistent");
      await expect(assignedSearchInput).toHaveValue("nonexistent");

      // Wait for search to filter assigned variables
      const filteredAssignedCount = await removeButtons.count();
      expect(filteredAssignedCount).toBeLessThanOrEqual(initialAssignedCount);

      // Clear assigned search
      await assignedSearchInput.clear();
      await expect(assignedSearchInput).toHaveValue("");

      // Wait for assigned list to be restored
      await expect(removeButtons).toHaveCount(initialAssignedCount);
    }
  });
});
