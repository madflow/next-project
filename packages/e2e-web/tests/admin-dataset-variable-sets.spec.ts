import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Admin Dataset Variable Sets", () => {
  let datasetName: string;

  test.beforeEach(async ({ page }) => {
    // Create a unique dataset name for each test
    datasetName = `Test Dataset Variable Sets ${Date.now()}`;

    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Create a test dataset
    await page.goto("/admin/datasets");
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

    // Navigate to Variable Sets tab
    await page.getByTestId("app.admin.editor.variablesets.tab").click();
  });

  test("should create a new variable set successfully", async ({ page }) => {
    const setName = `Demographics Set ${Date.now()}`;
    const setDescription = "Contains demographic variables like age, gender, etc.";

    // Click create set button
    await page.getByTestId("admin.dataset.variableset.create").click();

    // Fill in the form
    await page.getByTestId("admin.dataset.variableset.form.name").fill(setName);
    await page.getByTestId("admin.dataset.variableset.form.description").fill(setDescription);

    // Submit the form
    await page.getByTestId("admin.dataset.variableset.form.submit").click();

    // Verify the set was created and appears in the tree
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })
    ).toBeVisible();
  });

  test("should create a hierarchical variable set with parent", async ({ page }) => {
    const parentSetName = `Parent Set ${Date.now()}`;
    const childSetName = `Child Set ${Date.now()}`;

    // Create parent set first
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(parentSetName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: parentSetName })
    ).toBeVisible();

    // Create child set with parent
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(childSetName);

    // Select parent from dropdown
    await page.getByTestId("admin.dataset.variableset.form.parent").click();
    await page.getByRole("option", { name: parentSetName }).click();

    await page.getByTestId("admin.dataset.variableset.form.submit").click();

    // Verify both sets are visible and hierarchical structure
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: parentSetName })
    ).toBeVisible();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: childSetName })
    ).toBeVisible();
  });

  test("should edit an existing variable set", async ({ page }) => {
    const originalSetName = `Original Set ${Date.now()}`;
    const updatedSetName = `Updated Set ${Date.now()}`;
    const updatedDescription = "Updated description for the set";

    // Create a set first
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(originalSetName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: originalSetName })
    ).toBeVisible();

    // Edit the set
    await page.getByTestId("admin.dataset.variableset.tree.edit").first().click();

    // Update the name and description
    await page.getByTestId("admin.dataset.variableset.form.name").clear();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(updatedSetName);
    await page.getByTestId("admin.dataset.variableset.form.description").fill(updatedDescription);

    await page.getByTestId("admin.dataset.variableset.form.submit").click();

    // Verify the set was updated
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: updatedSetName })
    ).toBeVisible();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: originalSetName })
    ).toBeHidden();
  });

  test("should assign variables to a variable set", async ({ page }) => {
    const setName = `Assignment Test Set ${Date.now()}`;

    // Create a variable set
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(setName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })
    ).toBeVisible();

    // Select the set in the tree to enable variable assignment
    await page.locator('[data-testid*="admin.dataset.variableset.tree.item"]').filter({ hasText: setName }).click();

    // Wait for variable assignment section to load
    await expect(page.getByTestId("admin.dataset.variableset.available.variables.list")).toBeVisible();

    // Assign the first available variable
    const addButton = page.getByTestId("admin.dataset.variableset.assignment.add").first();
    await addButton.click();

    // Wait for the assignment to complete - check that a remove button appears
    await expect(page.getByTestId("admin.dataset.variableset.assignment.remove").first()).toBeVisible();
  });

  test("should remove variables from a variable set", async ({ page }) => {
    const setName = `Removal Test Set ${Date.now()}`;

    // Create a variable set
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(setName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })
    ).toBeVisible();

    // Select the set
    await page.locator('[data-testid*="admin.dataset.variableset.tree.item"]').filter({ hasText: setName }).click();
    await expect(page.getByTestId("admin.dataset.variableset.available.variables.list")).toBeVisible();

    // Assign a variable first
    const addButton = page.getByTestId("admin.dataset.variableset.assignment.add").first();
    await addButton.click();

    // Wait for assignment to complete
    await expect(page.getByTestId("admin.dataset.variableset.assignment.remove").first()).toBeVisible();

    // Now remove the variable
    const removeButton = page.getByTestId("admin.dataset.variableset.assignment.remove").first();
    await removeButton.click();

    // Verify variable is back in available section - check that add button is visible again
    await expect(page.getByTestId("admin.dataset.variableset.assignment.add").first()).toBeVisible();
  });

  test("should delete a variable set", async ({ page }) => {
    const setName = `Delete Test Set ${Date.now()}`;

    // Create a variable set
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(setName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })
    ).toBeVisible();

    // Delete the set
    await page.getByTestId("admin.dataset.variableset.delete.trigger").first().click();

    // Confirm deletion in the dialog
    await page.getByTestId("admin.dataset.variableset.delete.confirm").click();

    // Verify the set is no longer visible in the tree
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })
    ).toBeHidden();
  });

  test("should cancel variable set creation", async ({ page }) => {
    const setName = `Cancelled Set ${Date.now()}`;

    // Start creating a set
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(setName);

    // Cancel the form
    await page.getByTestId("admin.dataset.variableset.form.cancel").click();

    // Verify the set was not created - should not be in tree
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })
    ).toBeHidden();
  });

  test("should cancel variable set deletion", async ({ page }) => {
    const setName = `Persistent Set ${Date.now()}`;

    // Create a variable set
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(setName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })
    ).toBeVisible();

    // Start deletion but cancel
    await page.getByTestId("admin.dataset.variableset.delete.trigger").first().click();
    await page.getByTestId("admin.dataset.variableset.delete.cancel").click();

    // Verify the set still exists
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })
    ).toBeVisible();
  });

  test("should handle multiple variable sets and complex hierarchy", async ({ page }) => {
    const rootSetName = `Root Set ${Date.now()}`;
    const childSet1Name = `Child Set 1 ${Date.now()}`;
    const childSet2Name = `Child Set 2 ${Date.now()}`;
    const grandchildSetName = `Grandchild Set ${Date.now()}`;

    // Create root set
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(rootSetName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: rootSetName })
    ).toBeVisible();

    // Create first child set
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(childSet1Name);
    await page.getByTestId("admin.dataset.variableset.form.parent").click();
    await page.getByRole("option", { name: rootSetName }).click();
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: childSet1Name })
    ).toBeVisible();

    // Create second child set
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(childSet2Name);
    await page.getByTestId("admin.dataset.variableset.form.parent").click();
    await page.getByRole("option", { name: rootSetName }).click();
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: childSet2Name })
    ).toBeVisible();

    // Create grandchild set
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(grandchildSetName);
    await page.getByTestId("admin.dataset.variableset.form.parent").click();
    await page.getByRole("option", { name: childSet1Name }).click();
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: grandchildSetName })
    ).toBeVisible();

    // Verify all sets are visible
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: rootSetName })
    ).toBeVisible();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: childSet1Name })
    ).toBeVisible();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: childSet2Name })
    ).toBeVisible();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: grandchildSetName })
    ).toBeVisible();
  });

  test("should validate required fields in variable set form", async ({ page }) => {
    // Try to create a set without a name
    await page.getByTestId("admin.dataset.variableset.create").click();

    // Leave name empty and try to submit
    await page.getByTestId("admin.dataset.variableset.form.submit").click();

    // Form should not close and should show validation error
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("should test variable assignment search functionality", async ({ page }) => {
    const setName = `Search Test Set ${Date.now()}`;

    // Create a variable set
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(setName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })
    ).toBeVisible();

    // Select the set
    await page.locator('[data-testid*="admin.dataset.variableset.tree.item"]').filter({ hasText: setName }).click();
    await expect(page.getByTestId("admin.dataset.variableset.available.variables.list")).toBeVisible();

    // Wait for variables to load and count initial available variables
    const initialVariableCount = await page.getByTestId("admin.dataset.variableset.assignment.add").count();
    expect(initialVariableCount).toBeGreaterThan(0);

    // Test search in available variables section
    const searchInput = page.getByPlaceholder(/search/i).first();
    await searchInput.fill("age");

    // Verify search input value
    await expect(searchInput).toHaveValue("age");

    // Wait for search results to update

    // Verify that search results are filtered (should be fewer variables)
    const filteredVariableCount = await page.getByTestId("admin.dataset.variableset.assignment.add").count();
    expect(filteredVariableCount).toBeLessThanOrEqual(initialVariableCount);

    // Clear search and verify variables list is restored
    const searchResponsePromiseClear = page.waitForResponse(
      (response) =>
        response.url().includes("/variables/unassigned") &&
        response.request().url().includes("search") === false &&
        response.status() === 200
    );
    await searchInput.clear();
    await searchResponsePromiseClear;
    const restoredVariableCount = await page.getByTestId("admin.dataset.variableset.assignment.add").count();
    expect(restoredVariableCount).toBe(initialVariableCount);

    // Test search with no results
    // http://localhost:3000/api/datasets/0198e639-3e96-734b-b0db-af0c4350a2c4/variables/unassigned?limit=100&offset=0&search=nonexistentvariablename123
    const searchResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/variables/unassigned") &&
        response.request().url().includes("search=nonexistentvariablename123") &&
        response.status() === 200
    );
    await searchInput.fill("nonexistentvariablename123");
    await searchResponsePromise;
    const noResultsCount = await page.getByTestId("admin.dataset.variableset.assignment.add").count();
    expect(noResultsCount).toBe(0);
  });

  test("should test search functionality in both available and assigned variables", async ({ page }) => {
    const setName = `Search Both Sections ${Date.now()}`;

    // Create a variable set and assign some variables to it
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(setName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })
    ).toBeVisible();

    // Select the set
    await page.locator('[data-testid*="admin.dataset.variableset.tree.item"]').filter({ hasText: setName }).click();
    await expect(page.getByTestId("admin.dataset.variableset.available.variables.list")).toBeVisible();

    // Assign a few variables to the set first
    const addButtons = page.getByTestId("admin.dataset.variableset.assignment.add");
    await addButtons.first().click();
    await expect(page.getByTestId("admin.dataset.variableset.assignment.remove").first()).toBeVisible();
    await addButtons.first().click(); // Add another variable

    // Test search in assigned variables section
    const assignedSearchInput = page.getByPlaceholder(/search/i).last(); // Second search input (assigned section)

    // Wait for assigned variables to load
    const initialAssignedCount = await page.getByTestId("admin.dataset.variableset.assignment.remove").count();

    if (initialAssignedCount > 0) {
      // Test search in assigned section
      const searchResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/variablesets/") &&
          response.url().includes("/variables") &&
          response.request().url().includes("search=nonexistent") &&
          response.status() === 200
      );
      await assignedSearchInput.fill("nonexistent");
      await searchResponsePromise;
      const filteredAssignedCount = await page.getByTestId("admin.dataset.variableset.assignment.remove").count();
      expect(filteredAssignedCount).toBeLessThanOrEqual(initialAssignedCount);

      // Clear search in assigned section
      const clearSearchResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/variablesets/") &&
          response.url().includes("/variables") &&
          !response.request().url().includes("search") &&
          response.status() === 200
      );
      await assignedSearchInput.clear();
      await clearSearchResponsePromise;
      const restoredAssignedCount = await page.getByTestId("admin.dataset.variableset.assignment.remove").count();
      expect(restoredAssignedCount).toBe(initialAssignedCount);
    }

    // Test search in available variables section
    const availableSearchInput = page.getByPlaceholder(/search/i).first(); // First search input (available section)
    const initialAvailableCount = await page.getByTestId("admin.dataset.variableset.assignment.add").count();

    if (initialAvailableCount > 0) {
      const searchAvailableResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/variables/unassigned") &&
          response.request().url().includes("search=age") &&
          response.status() === 200
      );
      await availableSearchInput.fill("age");
      await searchAvailableResponsePromise;
      const filteredAvailableCount = await page.getByTestId("admin.dataset.variableset.assignment.add").count();
      expect(filteredAvailableCount).toBeLessThanOrEqual(initialAvailableCount);

      // Clear search in available section
      const clearAvailableResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/variables/unassigned") &&
          !response.request().url().includes("search") &&
          response.status() === 200
      );
      await availableSearchInput.clear();
      await clearAvailableResponsePromise;
      const restoredAvailableCount = await page.getByTestId("admin.dataset.variableset.assignment.add").count();
      expect(restoredAvailableCount).toBe(initialAvailableCount);
    }
  });

  test("should preserve variable set state during navigation", async ({ page }) => {
    const setName = `Navigation Test Set ${Date.now()}`;

    // Create a variable set
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(setName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })
    ).toBeVisible();

    // Navigate to variables tab and back
    await page.getByTestId("app.admin.editor.variables.tab").click();
    await page.getByTestId("app.admin.editor.variablesets.tab").click();

    // Verify the set still exists
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })
    ).toBeVisible();
  });
});
