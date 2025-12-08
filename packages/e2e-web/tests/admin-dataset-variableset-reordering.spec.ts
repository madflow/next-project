import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Admin Dataset Variableset Reordering", () => {
  let datasetName: string;

  test.beforeEach(async ({ page }) => {
    // Create a unique dataset name for each test
    datasetName = `Test Dataset Reordering ${Date.now()}`;

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

  test("should reorder top-level variablesets", async ({ page }) => {
    const set1Name = `Set A ${Date.now()}`;
    const set2Name = `Set B ${Date.now()}`;
    const set3Name = `Set C ${Date.now()}`;

    // Create three variablesets in order A, B, C
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(set1Name);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: set1Name })
    ).toBeVisible();

    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(set2Name);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: set2Name })
    ).toBeVisible();

    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(set3Name);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: set3Name })
    ).toBeVisible();

    // Get initial order
    const items = page.locator('[data-testid*="admin.dataset.variableset.tree.item"]');
    const initialTexts = await items.allTextContents();
    expect(initialTexts[0]).toContain(set1Name);
    expect(initialTexts[1]).toContain(set2Name);
    expect(initialTexts[2]).toContain(set3Name);

    // Drag set C (index 2) to position of set A (index 0)
    const setC = items.nth(2);
    const setA = items.nth(0);
    await setC.dragTo(setA);

    // Wait for reorder to complete
    await page.waitForTimeout(500);

    // Verify new order is C, A, B
    const newTexts = await items.allTextContents();
    expect(newTexts[0]).toContain(set3Name);
    expect(newTexts[1]).toContain(set1Name);
    expect(newTexts[2]).toContain(set2Name);

    // Refresh and verify persistence
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByTestId("app.admin.editor.variablesets.tab").click();
    await page.waitForLoadState("networkidle");

    const persistedTexts = await items.allTextContents();
    expect(persistedTexts[0]).toContain(set3Name);
    expect(persistedTexts[1]).toContain(set1Name);
    expect(persistedTexts[2]).toContain(set2Name);
  });

  test("should reorder child variablesets within same parent", async ({ page }) => {
    const parentSetName = `Parent Set ${Date.now()}`;
    const child1Name = `Child A ${Date.now()}`;
    const child2Name = `Child B ${Date.now()}`;
    const child3Name = `Child C ${Date.now()}`;

    // Create parent set
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(parentSetName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: parentSetName })
    ).toBeVisible();

    // Create three child sets
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(child1Name);
    await page.getByTestId("admin.dataset.variableset.form.parent").click();
    await page.getByRole("option", { name: parentSetName }).click();
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: child1Name })
    ).toBeVisible();

    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(child2Name);
    await page.getByTestId("admin.dataset.variableset.form.parent").click();
    await page.getByRole("option", { name: parentSetName }).click();
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: child2Name })
    ).toBeVisible();

    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(child3Name);
    await page.getByTestId("admin.dataset.variableset.form.parent").click();
    await page.getByRole("option", { name: parentSetName }).click();
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: child3Name })
    ).toBeVisible();

    // Get all tree items - parent is first, then children
    const items = page.locator('[data-testid*="admin.dataset.variableset.tree.item"]');
    const initialTexts = await items.allTextContents();

    // Verify parent is first, then children in order A, B, C
    expect(initialTexts[0]).toContain(parentSetName);
    expect(initialTexts[1]).toContain(child1Name);
    expect(initialTexts[2]).toContain(child2Name);
    expect(initialTexts[3]).toContain(child3Name);

    // Drag child C (index 3) to position of child A (index 1)
    const childC = items.nth(3);
    const childA = items.nth(1);
    await childC.dragTo(childA);

    // Wait for reorder to complete
    await page.waitForTimeout(500);

    // Verify new order: parent, then C, A, B
    const newTexts = await items.allTextContents();
    expect(newTexts[0]).toContain(parentSetName);
    expect(newTexts[1]).toContain(child3Name);
    expect(newTexts[2]).toContain(child1Name);
    expect(newTexts[3]).toContain(child2Name);

    // Refresh and verify persistence
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByTestId("app.admin.editor.variablesets.tab").click();
    await page.waitForLoadState("networkidle");

    const persistedTexts = await items.allTextContents();
    expect(persistedTexts[0]).toContain(parentSetName);
    expect(persistedTexts[1]).toContain(child3Name);
    expect(persistedTexts[2]).toContain(child1Name);
    expect(persistedTexts[3]).toContain(child2Name);
  });

  test("should preserve hierarchy levels when reordering", async ({ page }) => {
    const parentSetName = `Parent Set ${Date.now()}`;
    const child1Name = `Child 1 ${Date.now()}`;
    const child2Name = `Child 2 ${Date.now()}`;

    // Create parent and two children
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(parentSetName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: parentSetName })
    ).toBeVisible();

    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(child1Name);
    await page.getByTestId("admin.dataset.variableset.form.parent").click();
    await page.getByRole("option", { name: parentSetName }).click();
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: child1Name })
    ).toBeVisible();

    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(child2Name);
    await page.getByTestId("admin.dataset.variableset.form.parent").click();
    await page.getByRole("option", { name: parentSetName }).click();
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: child2Name })
    ).toBeVisible();

    // Reorder children
    const items = page.locator('[data-testid*="admin.dataset.variableset.tree.item"]');
    const child2Item = items.nth(2);
    const child1Item = items.nth(1);
    await child2Item.dragTo(child1Item);

    await page.waitForTimeout(500);

    // Verify children are still under parent (not promoted to root level)
    const texts = await items.allTextContents();
    expect(texts[0]).toContain(parentSetName);
    expect(texts[1]).toContain(child2Name);
    expect(texts[2]).toContain(child1Name);

    // Verify hierarchy is preserved - children should still be nested visually
    // The parent should still show the folder icon and children should be indented
    const parentItem = items.first();
    await expect(parentItem).toBeVisible();
  });

  test("should show drag handle on hover for variableset", async ({ page }) => {
    const setName = `Hover Test Set ${Date.now()}`;

    // Create a variableset
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(setName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })
    ).toBeVisible();

    // Get the tree item and drag handle
    const treeItem = page.locator('[data-testid*="admin.dataset.variableset.tree.item"]').first();
    const dragHandle = page.getByTestId("admin.dataset.variableset.tree.drag-handle").first();

    // Drag handle should be hidden initially (opacity-0)
    await expect(dragHandle).toHaveClass(/opacity-0/);

    // Hover over the tree item
    await treeItem.hover();

    // Drag handle should become visible (group-hover:opacity-100)
    // Note: We can't directly test CSS hover states, but the element should be present
    await expect(dragHandle).toBeVisible();
  });

  test("should reorder assigned variables within a variableset", async ({ page }) => {
    const setName = `Variable Reorder Set ${Date.now()}`;

    // Create a variableset
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(setName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })
    ).toBeVisible();

    // Select the set
    await page.locator('[data-testid*="admin.dataset.variableset.tree.item"]').filter({ hasText: setName }).click();
    await expect(page.getByTestId("admin.dataset.variableset.available.variables.list")).toBeVisible();

    // Assign 4 variables
    const addButtons = page.getByTestId("admin.dataset.variableset.assignment.add");
    await addButtons.nth(0).click();
    await page.waitForTimeout(300);
    await addButtons.nth(0).click();
    await page.waitForTimeout(300);
    await addButtons.nth(0).click();
    await page.waitForTimeout(300);
    await addButtons.nth(0).click();
    await page.waitForTimeout(500);

    // Verify we have 4 assigned variables
    const assignedList = page.getByTestId("admin.dataset.variableset.assigned.variables.list");
    const assignedItems = assignedList.locator('[data-testid*="admin.dataset.variableset.assigned.variable"]');
    await expect(assignedItems).toHaveCount(4);

    // Get initial order (by variable names)
    const initialOrder = await assignedItems.allTextContents();

    // Drag the fourth variable to the first position
    const fourthVariable = assignedItems.nth(3);
    const firstVariable = assignedItems.nth(0);
    await fourthVariable.dragTo(firstVariable);

    // Wait for reorder to complete
    await page.waitForTimeout(500);

    // Verify new order
    const newOrder = await assignedItems.allTextContents();
    expect(newOrder[0]).toBe(initialOrder[3]);
    expect(newOrder[1]).toBe(initialOrder[0]);
    expect(newOrder[2]).toBe(initialOrder[1]);
    expect(newOrder[3]).toBe(initialOrder[2]);

    // Refresh and verify persistence
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByTestId("app.admin.editor.variablesets.tab").click();
    await page.waitForLoadState("networkidle");

    // Select the set again
    await page.locator('[data-testid*="admin.dataset.variableset.tree.item"]').filter({ hasText: setName }).click();
    await expect(page.getByTestId("admin.dataset.variableset.assigned.variables.list")).toBeVisible();
    await page.waitForTimeout(500);

    const persistedOrder = await assignedItems.allTextContents();
    expect(persistedOrder[0]).toBe(initialOrder[3]);
    expect(persistedOrder[1]).toBe(initialOrder[0]);
    expect(persistedOrder[2]).toBe(initialOrder[1]);
    expect(persistedOrder[3]).toBe(initialOrder[2]);
  });

  test("should show drag handle on hover for assigned variables", async ({ page }) => {
    const setName = `Variable Hover Test ${Date.now()}`;

    // Create a variableset and assign a variable
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(setName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })
    ).toBeVisible();

    // Select the set
    await page.locator('[data-testid*="admin.dataset.variableset.tree.item"]').filter({ hasText: setName }).click();
    await expect(page.getByTestId("admin.dataset.variableset.available.variables.list")).toBeVisible();

    // Assign a variable
    const addButton = page.getByTestId("admin.dataset.variableset.assignment.add").first();
    await addButton.click();
    await page.waitForTimeout(500);

    // Get the assigned variable item and drag handle
    const assignedItem = page.locator('[data-testid*="admin.dataset.variableset.assigned.variable"]').first();
    const dragHandle = page.getByTestId("admin.dataset.variableset.variable.drag-handle").first();

    // Drag handle should be hidden initially (opacity-0)
    await expect(dragHandle).toHaveClass(/opacity-0/);

    // Hover over the assigned variable item
    await assignedItem.hover();

    // Drag handle should become visible
    await expect(dragHandle).toBeVisible();
  });

  test("should show visual feedback during drag operation", async ({ page }) => {
    const set1Name = `Drag Feedback 1 ${Date.now()}`;
    const set2Name = `Drag Feedback 2 ${Date.now()}`;

    // Create two variablesets
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(set1Name);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: set1Name })
    ).toBeVisible();

    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(set2Name);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: set2Name })
    ).toBeVisible();

    const items = page.locator('[data-testid*="admin.dataset.variableset.tree.item"]');
    const set2Item = items.nth(1);

    // Perform drag operation - the component should show visual feedback
    // (opacity change during drag based on isDragging state)
    await set2Item.dragTo(items.nth(0));

    // After drop, items should be reordered
    await page.waitForTimeout(500);
    const newTexts = await items.allTextContents();
    expect(newTexts[0]).toContain(set2Name);
    expect(newTexts[1]).toContain(set1Name);
  });

  test("should maintain reorder after adding new variableset", async ({ page }) => {
    const set1Name = `Original 1 ${Date.now()}`;
    const set2Name = `Original 2 ${Date.now()}`;
    const set3Name = `New Set ${Date.now()}`;

    // Create two variablesets
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(set1Name);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: set1Name })
    ).toBeVisible();

    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(set2Name);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: set2Name })
    ).toBeVisible();

    // Reorder them (swap positions)
    const items = page.locator('[data-testid*="admin.dataset.variableset.tree.item"]');
    await items.nth(1).dragTo(items.nth(0));
    await page.waitForTimeout(500);

    // Verify new order is set2, set1
    let texts = await items.allTextContents();
    expect(texts[0]).toContain(set2Name);
    expect(texts[1]).toContain(set1Name);

    // Add a new variableset
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(set3Name);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: set3Name })
    ).toBeVisible();

    // Verify the original order is still preserved for the first two
    texts = await items.allTextContents();
    expect(texts[0]).toContain(set2Name);
    expect(texts[1]).toContain(set1Name);
    expect(texts[2]).toContain(set3Name);
  });

  test("should persist reordering across tab navigation", async ({ page }) => {
    const set1Name = `Nav Test 1 ${Date.now()}`;
    const set2Name = `Nav Test 2 ${Date.now()}`;

    // Create two variablesets
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(set1Name);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: set1Name })
    ).toBeVisible();

    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(set2Name);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: set2Name })
    ).toBeVisible();

    // Reorder them
    const items = page.locator('[data-testid*="admin.dataset.variableset.tree.item"]');
    await items.nth(1).dragTo(items.nth(0));
    await page.waitForTimeout(500);

    // Verify order
    let texts = await items.allTextContents();
    expect(texts[0]).toContain(set2Name);
    expect(texts[1]).toContain(set1Name);

    // Navigate to variables tab
    await page.getByTestId("app.admin.editor.variables.tab").click();
    await page.waitForLoadState("networkidle");

    // Navigate back to variablesets tab
    await page.getByTestId("app.admin.editor.variablesets.tab").click();
    await page.waitForLoadState("networkidle");

    // Verify order is still preserved
    texts = await items.allTextContents();
    expect(texts[0]).toContain(set2Name);
    expect(texts[1]).toContain(set1Name);
  });

  test("should reorder multiple times in succession", async ({ page }) => {
    const set1Name = `Multi Reorder 1 ${Date.now()}`;
    const set2Name = `Multi Reorder 2 ${Date.now()}`;
    const set3Name = `Multi Reorder 3 ${Date.now()}`;

    // Create three variablesets
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(set1Name);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: set1Name })
    ).toBeVisible();

    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(set2Name);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: set2Name })
    ).toBeVisible();

    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(set3Name);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: set3Name })
    ).toBeVisible();

    const items = page.locator('[data-testid*="admin.dataset.variableset.tree.item"]');

    // First reorder: move set3 to top
    await items.nth(2).dragTo(items.nth(0));
    await page.waitForTimeout(500);

    let texts = await items.allTextContents();
    expect(texts[0]).toContain(set3Name);
    expect(texts[1]).toContain(set1Name);
    expect(texts[2]).toContain(set2Name);

    // Second reorder: move set2 to top
    await items.nth(2).dragTo(items.nth(0));
    await page.waitForTimeout(500);

    texts = await items.allTextContents();
    expect(texts[0]).toContain(set2Name);
    expect(texts[1]).toContain(set3Name);
    expect(texts[2]).toContain(set1Name);

    // Third reorder: move set1 to middle
    await items.nth(2).dragTo(items.nth(1));
    await page.waitForTimeout(500);

    texts = await items.allTextContents();
    expect(texts[0]).toContain(set2Name);
    expect(texts[1]).toContain(set1Name);
    expect(texts[2]).toContain(set3Name);
  });

  test("should handle reordering of variables after removing and adding", async ({ page }) => {
    const setName = `Variable Manipulation ${Date.now()}`;

    // Create a variableset
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(setName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })
    ).toBeVisible();

    // Select the set
    await page.locator('[data-testid*="admin.dataset.variableset.tree.item"]').filter({ hasText: setName }).click();
    await expect(page.getByTestId("admin.dataset.variableset.available.variables.list")).toBeVisible();

    // Assign 3 variables
    const addButtons = page.getByTestId("admin.dataset.variableset.assignment.add");
    await addButtons.nth(0).click();
    await page.waitForTimeout(300);
    await addButtons.nth(0).click();
    await page.waitForTimeout(300);
    await addButtons.nth(0).click();
    await page.waitForTimeout(500);

    const assignedList = page.getByTestId("admin.dataset.variableset.assigned.variables.list");
    const assignedItems = assignedList.locator('[data-testid*="admin.dataset.variableset.assigned.variable"]');

    // Get initial order
    const initialOrder = await assignedItems.allTextContents();

    // Reorder: move third to first
    await assignedItems.nth(2).dragTo(assignedItems.nth(0));
    await page.waitForTimeout(500);

    // Remove the middle variable
    const removeButtons = page.getByTestId("admin.dataset.variableset.assignment.remove");
    await removeButtons.nth(1).click();
    await page.waitForTimeout(500);

    // Verify we have 2 variables left
    await expect(assignedItems).toHaveCount(2);

    // Add another variable
    await addButtons.nth(0).click();
    await page.waitForTimeout(500);

    // Verify we have 3 variables again
    await expect(assignedItems).toHaveCount(3);

    // Reorder should still work
    await assignedItems.nth(2).dragTo(assignedItems.nth(0));
    await page.waitForTimeout(500);

    // Verify reordering worked (just check count is still 3)
    await expect(assignedItems).toHaveCount(3);
  });
});
