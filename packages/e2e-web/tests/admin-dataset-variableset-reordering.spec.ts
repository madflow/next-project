import { Page, expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser, waitForElementVisible } from "../utils";

/**
 * Helper function to drag a variableset from one position to another using the drag handle
 * This is required for dnd-kit which only responds to drags initiated from the drag handle
 */
async function dragVariablesetFromHandle(page: Page, sourceIndex: number, targetIndex: number) {
  const items = page.locator('[data-testid*="admin.dataset.variableset.tree.item"]');
  const dragHandles = page.getByTestId("admin.dataset.variableset.tree.drag-handle");

  // Hover over source item to make drag handle visible
  await items.nth(sourceIndex).hover();
  await waitForElementVisible(page, "admin.dataset.variableset.tree.drag-handle");

  const dragHandle = dragHandles.nth(sourceIndex);
  const targetItem = items.nth(targetIndex);

  const dragHandleBox = await dragHandle.boundingBox();
  const targetBox = await targetItem.boundingBox();

  if (!dragHandleBox || !targetBox) {
    throw new Error("Could not get bounding boxes for drag operation");
  }

  // Perform drag using mouse events
  await page.mouse.move(dragHandleBox.x + dragHandleBox.width / 2, dragHandleBox.y + dragHandleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
  await page.mouse.up();

  // Wait for drag operation to complete by waiting for the DOM to stabilize
  await page.waitForLoadState("networkidle");
}

/**
 * Helper function to drag a variable from one position to another using the drag handle
 */
async function dragVariableFromHandle(page: Page, sourceIndex: number, targetIndex: number) {
  const assignedList = page.getByTestId("admin.dataset.variableset.assigned.variables.list");
  const assignedItems = assignedList.locator('[data-testid*="admin.dataset.variableset.assigned.variable"]');
  const dragHandles = page.getByTestId("admin.dataset.variableset.variable.drag-handle");

  // Hover over source item to make drag handle visible
  await assignedItems.nth(sourceIndex).hover();
  await waitForElementVisible(page, "admin.dataset.variableset.variable.drag-handle");

  const dragHandle = dragHandles.nth(sourceIndex);
  const targetItem = assignedItems.nth(targetIndex);

  const dragHandleBox = await dragHandle.boundingBox();
  const targetBox = await targetItem.boundingBox();

  if (!dragHandleBox || !targetBox) {
    throw new Error("Could not get bounding boxes for drag operation");
  }

  // Perform drag using mouse events
  await page.mouse.move(dragHandleBox.x + dragHandleBox.width / 2, dragHandleBox.y + dragHandleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
  await page.mouse.up();

  // Wait for drag operation to complete by waiting for DOM to stabilize
  await page.waitForLoadState("networkidle");
}

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

    // Drag set C (index 2) to position of set A (index 0) using the drag handle
    await dragVariablesetFromHandle(page, 2, 0);

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

    // Re-query items after reload
    const persistedItems = page.locator('[data-testid*="admin.dataset.variableset.tree.item"]');
    await expect(persistedItems).toHaveCount(3);

    const persistedTexts = await persistedItems.allTextContents();
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
    for (const childName of [child1Name, child2Name, child3Name]) {
      await page.getByTestId("admin.dataset.variableset.create").click();
      await page.getByTestId("admin.dataset.variableset.form.name").fill(childName);
      await page.getByTestId("admin.dataset.variableset.form.parent").click();
      await page.getByRole("option", { name: parentSetName }).click();
      await page.getByTestId("admin.dataset.variableset.form.submit").click();
      await expect(
        page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: childName })
      ).toBeVisible();
    }

    // Get all tree items - parent is first, then children
    const items = page.locator('[data-testid*="admin.dataset.variableset.tree.item"]');
    const initialTexts = await items.allTextContents();

    // Verify parent is first, then children in order A, B, C
    expect(initialTexts[0]).toContain(parentSetName);
    expect(initialTexts[1]).toContain(child1Name);
    expect(initialTexts[2]).toContain(child2Name);
    expect(initialTexts[3]).toContain(child3Name);

    // Drag child C (index 3) to position of child A (index 1)
    await dragVariablesetFromHandle(page, 3, 1);

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

    // Re-query items after reload
    const persistedItems = page.locator('[data-testid*="admin.dataset.variableset.tree.item"]');
    await expect(persistedItems).toHaveCount(4);

    const persistedTexts = await persistedItems.allTextContents();
    expect(persistedTexts[0]).toContain(parentSetName);
    expect(persistedTexts[1]).toContain(child3Name);
    expect(persistedTexts[2]).toContain(child1Name);
    expect(persistedTexts[3]).toContain(child2Name);
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
    for (let i = 0; i < 4; i++) {
      await addButtons.nth(0).click();
      // Wait for assignment to complete by checking for remove button
      await page.waitForFunction((index) => {
        return document.querySelectorAll('[data-testid*="admin.dataset.variableset.assignment.remove"]').length > index;
      }, i);
    }

    // Verify we have 4 assigned variables
    const assignedList = page.getByTestId("admin.dataset.variableset.assigned.variables.list");
    const assignedItems = assignedList.locator('[data-testid*="admin.dataset.variableset.assigned.variable"]');
    await expect(assignedItems).toHaveCount(4);

    // Get initial order (by variable names)
    const initialOrder = await assignedItems.allTextContents();

    // Drag the fourth variable to the first position
    await dragVariableFromHandle(page, 3, 0);

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
    await waitForElementVisible(page, "admin.dataset.variableset.assigned.variables.list");

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
    // Wait for assignment to complete
    await waitForElementVisible(page, "admin.dataset.variableset.assignment.remove");

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
    await dragVariablesetFromHandle(page, 1, 0);

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
    for (const setName of [set1Name, set2Name, set3Name]) {
      await page.getByTestId("admin.dataset.variableset.create").click();
      await page.getByTestId("admin.dataset.variableset.form.name").fill(setName);
      await page.getByTestId("admin.dataset.variableset.form.submit").click();
      await expect(
        page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: setName })
      ).toBeVisible();
    }

    const items = page.locator('[data-testid*="admin.dataset.variableset.tree.item"]');

    // First reorder: move set3 to top
    await dragVariablesetFromHandle(page, 2, 0);
    let texts = await items.allTextContents();
    expect(texts[0]).toContain(set3Name);
    expect(texts[1]).toContain(set1Name);
    expect(texts[2]).toContain(set2Name);

    // Second reorder: move set2 to top
    await dragVariablesetFromHandle(page, 2, 0);
    texts = await items.allTextContents();
    expect(texts[0]).toContain(set2Name);
    expect(texts[1]).toContain(set3Name);
    expect(texts[2]).toContain(set1Name);

    // Third reorder: move set1 to middle
    await dragVariablesetFromHandle(page, 2, 1);
    texts = await items.allTextContents();
    expect(texts[0]).toContain(set2Name);
    expect(texts[1]).toContain(set1Name);
    expect(texts[2]).toContain(set3Name);
  });
});
