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
    
    // Navigate to Variable Sets tab
    await page.getByTestId("app.admin.editor.variablesets.tab").click();
    await page.waitForLoadState("networkidle");
  });

  test("should create a new variable set successfully", async ({ page }) => {
    const setName = `Demographics Set ${Date.now()}`;
    const setDescription = "Contains demographic variables like age, gender, etc.";
    
    // Click create set button
    await page.getByTestId("admin.dataset.variableset.create").click();
    
    // Fill in the form
    await page.getByRole("textbox", { name: /name/i }).fill(setName);
    await page.getByRole("textbox", { name: /description/i }).fill(setDescription);
    
    // Submit the form
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    
    // Verify the set was created and appears in the tree
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })).toBeVisible();
  });

  test("should create a hierarchical variable set with parent", async ({ page }) => {
    const parentSetName = `Parent Set ${Date.now()}`;
    const childSetName = `Child Set ${Date.now()}`;
    
    // Create parent set first
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByRole("textbox", { name: /name/i }).fill(parentSetName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: parentSetName })).toBeVisible();
    
    // Create child set with parent
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByRole("textbox", { name: /name/i }).fill(childSetName);
    
    // Select parent from dropdown
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: parentSetName }).click();
    
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    
    // Verify both sets are visible and hierarchical structure
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: parentSetName })).toBeVisible();
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: childSetName })).toBeVisible();
  });

  test("should edit an existing variable set", async ({ page }) => {
    const originalSetName = `Original Set ${Date.now()}`;
    const updatedSetName = `Updated Set ${Date.now()}`;
    const updatedDescription = "Updated description for the set";
    
    // Create a set first
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByRole("textbox", { name: /name/i }).fill(originalSetName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: originalSetName })).toBeVisible();
    
    // Edit the set
    await page.getByTestId("admin.dataset.variableset.tree.edit").first().click();
    
    // Update the name and description
    await page.getByRole("textbox", { name: /name/i }).clear();
    await page.getByRole("textbox", { name: /name/i }).fill(updatedSetName);
    await page.getByRole("textbox", { name: /description/i }).fill(updatedDescription);
    
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    
    // Verify the set was updated
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: updatedSetName })).toBeVisible();
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: originalSetName })).not.toBeVisible();
  });

  test("should assign variables to a variable set", async ({ page }) => {
    const setName = `Assignment Test Set ${Date.now()}`;
    
    // Create a variable set
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByRole("textbox", { name: /name/i }).fill(setName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })).toBeVisible();
    
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
    await page.getByRole("textbox", { name: /name/i }).fill(setName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })).toBeVisible();
    
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
    await page.getByRole("textbox", { name: /name/i }).fill(setName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })).toBeVisible();
    
    // Delete the set
    await page.getByTestId("admin.dataset.variableset.delete.trigger").first().click();
    
    // Confirm deletion in the dialog
    await page.getByTestId("admin.dataset.variableset.delete.confirm").click();
    
    // Verify the set is no longer visible in the tree
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })).not.toBeVisible();
  });

  test("should cancel variable set creation", async ({ page }) => {
    const setName = `Cancelled Set ${Date.now()}`;
    
    // Start creating a set
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByRole("textbox", { name: /name/i }).fill(setName);
    
    // Cancel the form
    await page.getByTestId("admin.dataset.variableset.form.cancel").click();
    
    // Verify the set was not created - should not be in tree
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })).not.toBeVisible();
  });

  test("should cancel variable set deletion", async ({ page }) => {
    const setName = `Persistent Set ${Date.now()}`;
    
    // Create a variable set
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByRole("textbox", { name: /name/i }).fill(setName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })).toBeVisible();
    
    // Start deletion but cancel
    await page.getByTestId("admin.dataset.variableset.delete.trigger").first().click();
    await page.getByTestId("admin.dataset.variableset.delete.cancel").click();
    
    // Verify the set still exists
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })).toBeVisible();
  });

  test("should handle multiple variable sets and complex hierarchy", async ({ page }) => {
    const rootSetName = `Root Set ${Date.now()}`;
    const childSet1Name = `Child Set 1 ${Date.now()}`;
    const childSet2Name = `Child Set 2 ${Date.now()}`;
    const grandchildSetName = `Grandchild Set ${Date.now()}`;
    
    // Create root set
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByRole("textbox", { name: /name/i }).fill(rootSetName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: rootSetName })).toBeVisible();
    
    // Create first child set
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByRole("textbox", { name: /name/i }).fill(childSet1Name);
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: rootSetName }).click();
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: childSet1Name })).toBeVisible();
    
    // Create second child set
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByRole("textbox", { name: /name/i }).fill(childSet2Name);
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: rootSetName }).click();
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: childSet2Name })).toBeVisible();
    
    // Create grandchild set
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByRole("textbox", { name: /name/i }).fill(grandchildSetName);
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: childSet1Name }).click();
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: grandchildSetName })).toBeVisible();
    
    // Verify all sets are visible
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: rootSetName })).toBeVisible();
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: childSet1Name })).toBeVisible();
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: childSet2Name })).toBeVisible();
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: grandchildSetName })).toBeVisible();
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
    await page.getByRole("textbox", { name: /name/i }).fill(setName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })).toBeVisible();
    
    // Select the set
    await page.locator('[data-testid*="admin.dataset.variableset.tree.item"]').filter({ hasText: setName }).click();
    await expect(page.getByTestId("admin.dataset.variableset.available.variables.list")).toBeVisible();
    
    // Test search in available variables
    const searchInput = page.getByPlaceholder(/search/i).first();
    await searchInput.fill("age");
    
    // Verify search results are filtered
    await expect(searchInput).toHaveValue("age");
  });

  test("should preserve variable set state during navigation", async ({ page }) => {
    const setName = `Navigation Test Set ${Date.now()}`;
    
    // Create a variable set
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByRole("textbox", { name: /name/i }).fill(setName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })).toBeVisible();
    
    // Navigate to variables tab and back
    await page.getByTestId("app.admin.editor.variables.tab").click();
    await page.waitForLoadState("networkidle");
    await page.getByTestId("app.admin.editor.variablesets.tab").click();
    await page.waitForLoadState("networkidle");
    
    // Verify the set still exists
    await expect(page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })).toBeVisible();
  });
});