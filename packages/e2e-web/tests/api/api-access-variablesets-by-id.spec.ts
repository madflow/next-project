import { type Browser, type Page, expect, test } from "@playwright/test";
import { type AuthenticatedUser, resolvedBaseUrl, testIds, testUsers } from "../../config";
import { loginUser } from "../../utils";

const ACCESSIBLE_DATASET_ID = testIds.datasets.withVariablesets;
const ACCESSIBLE_VARIABLESET_ID = testIds.variablesets.mediaUse;
const ACCESSIBLE_SUBSET_ID = testIds.variablesets.informationSources;
const OTHER_ACCESSIBLE_DATASET_ID = testIds.datasets.primary;
const NON_EXISTENT_ID = testIds.nonExistent;

type VariablesetHierarchyNode = {
  id: string;
  name: string;
  children?: VariablesetHierarchyNode[];
};

async function loginAs(page: Page, user: AuthenticatedUser) {
  await page.goto("/");
  await loginUser(page, testUsers[user].email, testUsers[user].password);
}

async function withAdminPage<T>(browser: Browser, callback: (page: Page) => Promise<T>) {
  const context = await browser.newContext({ baseURL: resolvedBaseUrl });
  const page = await context.newPage();

  try {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    return await callback(page);
  } finally {
    await context.close();
  }
}

async function createTemporaryVariableset(browser: Browser, name: string) {
  return await withAdminPage(browser, async (page) => {
    await page.goto(`/admin/datasets/${ACCESSIBLE_DATASET_ID}/editor`);
    await page.getByTestId("app.admin.editor.variablesets.tab").click();
    await page.getByTestId("admin.dataset.variableset.create").click();
    await page.getByTestId("admin.dataset.variableset.form.name").fill(name);
    await page.getByTestId("admin.dataset.variableset.form.submit").click();
    await expect(
      page.locator('[data-testid*="admin.dataset.variableset.tree.name"]').filter({ hasText: name })
    ).toBeVisible();

    const response = await page.request.get(`/api/datasets/${ACCESSIBLE_DATASET_ID}/variablesets?hierarchical=true`);
    expect(response.status()).toBe(200);

    const data = (await response.json()) as { hierarchy: VariablesetHierarchyNode[] };
    const stack = [...data.hierarchy];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        continue;
      }
      if (current.name === name) {
        return current.id;
      }
      if (current.children) {
        stack.push(...current.children);
      }
    }

    throw new Error(`Temporary variableset not found: ${name}`);
  });
}

async function deleteVariablesetAsAdmin(browser: Browser, variablesetId: string) {
  await withAdminPage(browser, async (page) => {
    const response = await page.request.delete(`/api/variablesets/${variablesetId}`);
    expect(response.status()).toBe(200);
  });
}

async function getVariableIdsAsAdmin(browser: Browser, variablesetId: string, count: number) {
  return await withAdminPage(browser, async (page) => {
    const response = await page.request.get(`/api/variablesets/${variablesetId}/variables`);
    expect(response.status()).toBe(200);

    const data = (await response.json()) as { rows: Array<{ id: string }> };
    const variableIds = data.rows.slice(0, count).map((variable) => variable.id);

    if (variableIds.length < count) {
      throw new Error(`Expected at least ${count} variables in variableset ${variablesetId}`);
    }

    return variableIds;
  });
}

test.describe("API Variablesets by id @api", () => {
  test.describe("GET /api/variablesets/:id/variables", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.get(`/api/variablesets/${ACCESSIBLE_VARIABLESET_ID}/variables`);
      expect(response.status()).toBe(401);
    });

    test("denies access for user with no organization", async ({ page }) => {
      await loginAs(page, "accountInNoOrg");
      const response = await page.request.get(`/api/variablesets/${ACCESSIBLE_VARIABLESET_ID}/variables`);
      expect(response.status()).toBe(401);
    });

    test("allows access for regular user with dataset access", async ({ page }) => {
      await loginAs(page, "regularUser");
      const response = await page.request.get(`/api/variablesets/${ACCESSIBLE_VARIABLESET_ID}/variables`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.rows)).toBe(true);
      expect(data.rows.length).toBeGreaterThan(0);
    });

    test("allows access for admin user", async ({ page }) => {
      await loginAs(page, "admin");
      const response = await page.request.get(`/api/variablesets/${ACCESSIBLE_VARIABLESET_ID}/variables`);
      expect(response.status()).toBe(200);
    });
  });

  test.describe("GET /api/variablesets/:id/contents", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.get(`/api/variablesets/${ACCESSIBLE_VARIABLESET_ID}/contents`);
      expect(response.status()).toBe(401);
    });

    test("denies access for user with no organization", async ({ page }) => {
      await loginAs(page, "accountInNoOrg");
      const response = await page.request.get(`/api/variablesets/${ACCESSIBLE_VARIABLESET_ID}/contents`);
      expect(response.status()).toBe(401);
    });

    test("allows access for regular user with dataset access", async ({ page }) => {
      await loginAs(page, "regularUser");
      const response = await page.request.get(`/api/variablesets/${ACCESSIBLE_VARIABLESET_ID}/contents`);
      expect(response.status()).toBe(200);

      const data = (await response.json()) as {
        contents: Array<{ contentType: string; subsetName: string | null }>;
      };
      expect(Array.isArray(data.contents)).toBe(true);
      expect(
        data.contents.some(
          (content) => content.contentType === "subset" && content.subsetName === "Informationsquellen"
        )
      ).toBe(true);
    });

    test("allows access for admin user", async ({ page }) => {
      await loginAs(page, "admin");
      const response = await page.request.get(`/api/variablesets/${ACCESSIBLE_VARIABLESET_ID}/contents`);
      expect(response.status()).toBe(200);
    });
  });

  test.describe("DELETE /api/variablesets/:id", () => {
    test("denies access when not logged in", async ({ browser, page }) => {
      const tempId = await createTemporaryVariableset(browser, `API delete unauth ${Date.now()}`);

      try {
        const response = await page.request.delete(`/api/variablesets/${tempId}`);
        expect(response.status()).toBe(401);
      } finally {
        await deleteVariablesetAsAdmin(browser, tempId);
      }
    });

    test("denies access for user with no organization", async ({ browser, page }) => {
      const tempId = await createTemporaryVariableset(browser, `API delete no org ${Date.now()}`);

      try {
        await loginAs(page, "accountInNoOrg");
        const response = await page.request.delete(`/api/variablesets/${tempId}`);
        expect(response.status()).toBe(401);
      } finally {
        await deleteVariablesetAsAdmin(browser, tempId);
      }
    });

    test("denies access for regular user", async ({ browser, page }) => {
      const tempId = await createTemporaryVariableset(browser, `API delete regular ${Date.now()}`);

      try {
        await loginAs(page, "regularUser");
        const response = await page.request.delete(`/api/variablesets/${tempId}`);
        expect(response.status()).toBe(401);
      } finally {
        await deleteVariablesetAsAdmin(browser, tempId);
      }
    });

    test("allows access for admin user", async ({ browser, page }) => {
      const tempId = await createTemporaryVariableset(browser, `API delete admin ${Date.now()}`);
      await loginAs(page, "admin");

      const response = await page.request.delete(`/api/variablesets/${tempId}`);
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ success: true });
    });
  });

  test.describe("POST /api/variablesets/:id/contents", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.post(`/api/variablesets/${ACCESSIBLE_VARIABLESET_ID}/contents`, {
        data: {
          contentType: "variable",
          referenceId: NON_EXISTENT_ID,
        },
      });
      expect(response.status()).toBe(401);
    });

    test("denies access for user with no organization", async ({ page }) => {
      await loginAs(page, "accountInNoOrg");
      const response = await page.request.post(`/api/variablesets/${ACCESSIBLE_VARIABLESET_ID}/contents`, {
        data: {
          contentType: "variable",
          referenceId: NON_EXISTENT_ID,
        },
      });
      expect(response.status()).toBe(401);
    });

    test("denies access for regular user", async ({ page }) => {
      await loginAs(page, "regularUser");
      const response = await page.request.post(`/api/variablesets/${ACCESSIBLE_VARIABLESET_ID}/contents`, {
        data: {
          contentType: "variable",
          referenceId: NON_EXISTENT_ID,
        },
      });
      expect(response.status()).toBe(401);
    });

    test("allows access for admin user", async ({ browser, page }) => {
      const tempId = await createTemporaryVariableset(browser, `API contents post ${Date.now()}`);
      const [variableId] = await getVariableIdsAsAdmin(browser, ACCESSIBLE_SUBSET_ID, 1);

      try {
        await loginAs(page, "admin");
        const response = await page.request.post(`/api/variablesets/${tempId}/contents`, {
          data: {
            contentType: "variable",
            referenceId: variableId,
          },
        });

        expect(response.status()).toBe(201);

        const data = (await response.json()) as { id: string };
        expect(typeof data.id).toBe("string");
      } finally {
        await deleteVariablesetAsAdmin(browser, tempId);
      }
    });
  });

  test.describe("DELETE /api/variablesets/:id/contents", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.delete(`/api/variablesets/${ACCESSIBLE_VARIABLESET_ID}/contents`, {
        data: {
          contentId: NON_EXISTENT_ID,
        },
      });
      expect(response.status()).toBe(401);
    });

    test("denies access for user with no organization", async ({ page }) => {
      await loginAs(page, "accountInNoOrg");
      const response = await page.request.delete(`/api/variablesets/${ACCESSIBLE_VARIABLESET_ID}/contents`, {
        data: {
          contentId: NON_EXISTENT_ID,
        },
      });
      expect(response.status()).toBe(401);
    });

    test("denies access for regular user", async ({ page }) => {
      await loginAs(page, "regularUser");
      const response = await page.request.delete(`/api/variablesets/${ACCESSIBLE_VARIABLESET_ID}/contents`, {
        data: {
          contentId: NON_EXISTENT_ID,
        },
      });
      expect(response.status()).toBe(401);
    });

    test("allows access for admin user", async ({ browser, page }) => {
      const tempId = await createTemporaryVariableset(browser, `API contents delete ${Date.now()}`);
      const [variableId] = await getVariableIdsAsAdmin(browser, ACCESSIBLE_SUBSET_ID, 1);
      await loginAs(page, "admin");

      const createResponse = await page.request.post(`/api/variablesets/${tempId}/contents`, {
        data: {
          contentType: "variable",
          referenceId: variableId,
        },
      });
      expect(createResponse.status()).toBe(201);

      const created = (await createResponse.json()) as { id: string };

      const deleteResponse = await page.request.delete(`/api/variablesets/${tempId}/contents`, {
        data: {
          contentId: created.id,
        },
      });

      expect(deleteResponse.status()).toBe(200);
      expect(await deleteResponse.json()).toEqual({ success: true });

      await deleteVariablesetAsAdmin(browser, tempId);
    });
  });

  test.describe("PUT /api/variablesets/:id/contents/reorder", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.put(`/api/variablesets/${ACCESSIBLE_VARIABLESET_ID}/contents/reorder`, {
        data: {
          contentIds: [],
        },
      });
      expect(response.status()).toBe(401);
    });

    test("denies access for user with no organization", async ({ page }) => {
      await loginAs(page, "accountInNoOrg");
      const response = await page.request.put(`/api/variablesets/${ACCESSIBLE_VARIABLESET_ID}/contents/reorder`, {
        data: {
          contentIds: [],
        },
      });
      expect(response.status()).toBe(401);
    });

    test("denies access for regular user", async ({ page }) => {
      await loginAs(page, "regularUser");
      const response = await page.request.put(`/api/variablesets/${ACCESSIBLE_VARIABLESET_ID}/contents/reorder`, {
        data: {
          contentIds: [],
        },
      });
      expect(response.status()).toBe(401);
    });

    test("allows access for admin user", async ({ browser, page }) => {
      const tempId = await createTemporaryVariableset(browser, `API contents reorder ${Date.now()}`);
      const variableIds = await getVariableIdsAsAdmin(browser, ACCESSIBLE_SUBSET_ID, 2);

      await loginAs(page, "admin");
      try {
        for (const variableId of variableIds) {
          const createResponse = await page.request.post(`/api/variablesets/${tempId}/contents`, {
            data: {
              contentType: "variable",
              referenceId: variableId,
            },
          });
          expect(createResponse.status()).toBe(201);
        }

        const contentsResponse = await page.request.get(`/api/variablesets/${tempId}/contents`);
        expect(contentsResponse.status()).toBe(200);

        const contentsData = (await contentsResponse.json()) as { contents: Array<{ id: string }> };
        const reversedIds = [...contentsData.contents].reverse().map((content) => content.id);

        const reorderResponse = await page.request.put(`/api/variablesets/${tempId}/contents/reorder`, {
          data: {
            contentIds: reversedIds,
          },
        });

        expect(reorderResponse.status()).toBe(200);
        expect(await reorderResponse.json()).toEqual({ success: true });

        const reorderedContentsResponse = await page.request.get(`/api/variablesets/${tempId}/contents`);
        expect(reorderedContentsResponse.status()).toBe(200);

        const reorderedContentsData = (await reorderedContentsResponse.json()) as { contents: Array<{ id: string }> };
        expect(reorderedContentsData.contents.map((content) => content.id)).toEqual(reversedIds);
      } finally {
        await deleteVariablesetAsAdmin(browser, tempId);
      }
    });
  });

  test.describe("GET /api/datasets/:id/variablesets/:setId/variables", () => {
    test("denies dataset and variableset mismatches", async ({ page }) => {
      await loginAs(page, "regularUser");

      const response = await page.request.get(
        `/api/datasets/${OTHER_ACCESSIBLE_DATASET_ID}/variablesets/${ACCESSIBLE_VARIABLESET_ID}/variables`
      );

      expect(response.status()).toBe(404);
    });
  });
});
