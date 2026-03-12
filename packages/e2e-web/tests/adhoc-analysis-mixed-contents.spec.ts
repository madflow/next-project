import { Page, expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

/**
 * Drag a content entry (variable or subset) from one index to another inside the
 * unified assigned-contents list. Unlike the existing `dragVariableFromHandle` helper,
 * this works across both `assigned.variable.*` and `assigned.subset.*` entries because
 * the new unified contents table interleaves both types in one ordered list.
 */
async function dragMixedContentFromHandle(page: Page, sourceIndex: number, targetIndex: number) {
  const assignedList = page.getByTestId("admin.dataset.variableset.assigned.variables.list");

  // Both variable rows and subset rows live in the same list; match both by prefix
  const allItems = assignedList.locator(
    '[data-testid*="admin.dataset.variableset.assigned.variable"],[data-testid*="admin.dataset.variableset.assigned.subset"]'
  );

  // Drag handles use two distinct test IDs depending on content type
  const allDragHandles = page.locator(
    '[data-testid="admin.dataset.variableset.variable.drag-handle"],[data-testid="admin.dataset.variableset.subset.drag-handle"]'
  );

  // Hover over source item so its drag handle becomes visible (opacity-0 → opacity-100)
  await allItems.nth(sourceIndex).hover();

  const dragHandle = allDragHandles.nth(sourceIndex);
  const targetItem = allItems.nth(targetIndex);

  const dragHandleBox = await dragHandle.boundingBox();
  const targetBox = await targetItem.boundingBox();

  if (!dragHandleBox || !targetBox) {
    throw new Error("Could not get bounding boxes for drag operation");
  }

  await page.mouse.move(dragHandleBox.x + dragHandleBox.width / 2, dragHandleBox.y + dragHandleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
  await page.mouse.up();
}

test.describe("Adhoc Analysis - Mixed Variables and Sets", () => {
  let datasetName: string;

  test.beforeEach(async ({ page }) => {
    datasetName = `Mixed Contents Dataset ${Date.now()}`;

    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Upload demo.sav as a new dataset
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();

    await page.getByTestId("admin.datasets.create.upload").click();
    const uploadFile = page.getByTestId("file-upload-input");
    await uploadFile.setInputFiles("testdata/spss/demo.sav");
    await page.getByTestId("app.admin.dataset.selected-file").waitFor({ timeout: 5000 });
    await page.getByTestId("app.admin.dataset.name-input").fill(datasetName);
    await page.getByTestId("app.admin.dataset.organization-trigger").click();
    await page.getByTestId("org-option-test-organization").click();
    await page.getByTestId("app.admin.dataset.upload-button").click();

    // Open the dataset editor
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();
    await page.getByTestId("app.datatable.search-input").fill(datasetName);
    await page.getByRole("link", { name: datasetName }).click();

    // Navigate to Variable Sets tab
    await page.getByTestId("app.admin.editor.variablesets.tab").click();
  });

  test("should render interleaved variables and subset in correct order in adhoc analysis", async ({ page }) => {
    const parentSetName = "Mixed Parent Set";
    const childSetName = "Child Sub Set";

    // -----------------------------------------------------------------------
    // Phase 1: Create parent variableset and a child variableset.
    // When the child is created with a parentId, the DAL automatically inserts
    // a "subset" content entry at position 0 in the parent's contents table.
    // -----------------------------------------------------------------------

    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(parentSetName);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: parentSetName })
    ).toBeVisible();

    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(childSetName);
    await page.getByTestId("admin.dataset.variableset.form.parent").click();
    await page.getByRole("option", { name: parentSetName }).click();
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: childSetName })
    ).toBeVisible();

    // -----------------------------------------------------------------------
    // Phase 2: Open the parent set's assignment panel and add two variables.
    // After this the contents list is:
    //   [Child Sub Set (position 0), var1 (position 100), var2 (position 200)]
    // -----------------------------------------------------------------------

    await page
      .locator('[data-testid*="admin.dataset.variableset.tree.item"]')
      .filter({ hasText: parentSetName })
      .click();
    await expect(page.getByTestId("admin.dataset.variableset.available.variables.list")).toBeVisible();

    const assignedList = page.getByTestId("admin.dataset.variableset.assigned.variables.list");
    const allAssignedItems = assignedList.locator(
      '[data-testid*="admin.dataset.variableset.assigned.variable"],[data-testid*="admin.dataset.variableset.assigned.subset"]'
    );

    // The child subset was auto-added, so there is already 1 entry in the assigned list
    await expect(allAssignedItems).toHaveCount(1);

    // Add first variable (index 0 in available list)
    await page.getByTestId("admin.dataset.variableset.assignment.add").nth(0).click();
    await expect(allAssignedItems).toHaveCount(2);

    // Add second variable (the original first slot was consumed; click index 0 again)
    await page.getByTestId("admin.dataset.variableset.assignment.add").nth(0).click();
    await expect(allAssignedItems).toHaveCount(3);

    // -----------------------------------------------------------------------
    // Phase 3: Reorder — drag the child subset from index 0 to index 1 so it
    // ends up between the two variables.
    // Target order: [var1, Child Sub Set, var2]
    // -----------------------------------------------------------------------

    await dragMixedContentFromHandle(page, 0, 1);

    // After the drag: var1, Child Sub Set, var2
    const reorderedTexts = await allAssignedItems.allTextContents();
    expect(reorderedTexts[0]).not.toContain(childSetName);
    expect(reorderedTexts[1]).toContain(childSetName);
    expect(reorderedTexts[2]).not.toContain(childSetName);

    // -----------------------------------------------------------------------
    // Phase 3b: Reload and confirm the new order is persisted in the database
    // -----------------------------------------------------------------------

    await page.reload();
    await page.getByTestId("app.admin.editor.variablesets.tab").click();
    await page
      .locator('[data-testid*="admin.dataset.variableset.tree.item"]')
      .filter({ hasText: parentSetName })
      .click();
    await expect(page.getByTestId("admin.dataset.variableset.assigned.variables.list")).toBeVisible();

    const persistedTexts = await allAssignedItems.allTextContents();
    expect(persistedTexts[0]).not.toContain(childSetName);
    expect(persistedTexts[1]).toContain(childSetName);
    expect(persistedTexts[2]).not.toContain(childSetName);

    // Extract the SPSS variable name (short machine name) from each variable row.
    // The variable row renders: label (optional), then variable name in a <p class="text-muted-foreground">.
    // We locate that element directly via its CSS class within each row.
    const variableRows = assignedList.locator('[data-testid*="admin.dataset.variableset.assigned.variable"]');

    const var1NameEl = variableRows.nth(0).locator("p.text-muted-foreground").first();
    const var2NameEl = variableRows.nth(1).locator("p.text-muted-foreground").first();

    const var1Name = (await var1NameEl.textContent())?.trim() ?? "";
    const var2Name = (await var2NameEl.textContent())?.trim() ?? "";

    // -----------------------------------------------------------------------
    // Phase 4: Assign the dataset to "test-project" so it appears in adhoc
    // -----------------------------------------------------------------------

    await page.getByTestId("app.admin.editor.projects.tab").click();
    await page.getByTestId("project-dropdown").click();
    await page.getByTestId("project-dropdown-item-test-project").click();
    await page.getByRole("button", { name: "Add to project" }).click();

    // Wait until the project name appears in the assignments table
    await expect(page.getByRole("cell", { name: "Test Project" })).toBeVisible({ timeout: 10000 });

    // -----------------------------------------------------------------------
    // Phase 5: Navigate to adhoc analysis and verify the interleaved rendering
    // -----------------------------------------------------------------------

    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Select the newly created dataset from the dropdown
    await page.getByTestId("app.dropdown.dataset.trigger").click();
    await page.getByText(datasetName).click();
    await expect(page.getByTestId("app.dropdown.dataset.trigger")).toContainText(datasetName);

    // The parent variableset must appear in the selector tree
    await expect(page.getByTestId(`variable-group-${parentSetName}`)).toBeVisible();

    // Expand the parent set to reveal its interleaved contents
    await page.getByTestId(`variable-group-expand-${parentSetName}`).click();

    // All three expected items must be visible: var1, child subset group, var2
    await expect(page.getByTestId(`variable-item-${var1Name}`)).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId(`variable-group-${childSetName}`)).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId(`variable-item-${var2Name}`)).toBeVisible({ timeout: 10000 });

    // Verify DOM order: var1 → Child Sub Set → var2
    // Use bounding boxes to confirm vertical ordering in the rendered tree.
    const var1Box = await page.getByTestId(`variable-item-${var1Name}`).boundingBox();
    const childGroupBox = await page.getByTestId(`variable-group-${childSetName}`).boundingBox();
    const var2Box = await page.getByTestId(`variable-item-${var2Name}`).boundingBox();

    expect(var1Box).not.toBeNull();
    expect(childGroupBox).not.toBeNull();
    expect(var2Box).not.toBeNull();

    // var1 must be above the child subset, and the child subset must be above var2
    expect(var1Box!.y).toBeLessThan(childGroupBox!.y);
    expect(childGroupBox!.y).toBeLessThan(var2Box!.y);

    // -----------------------------------------------------------------------
    // Phase 6: Clicking the first variable renders an analysis chart
    // -----------------------------------------------------------------------

    await page.getByTestId(`variable-item-${var1Name}`).click();
    await expect(page.locator("canvas, svg").first()).toBeVisible({ timeout: 10000 });
  });
});
