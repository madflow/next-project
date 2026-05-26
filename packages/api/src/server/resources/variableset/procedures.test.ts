import { ORPCError } from "@orpc/server";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { DatabaseInstance } from "@repo/database/clients";
import { datasetVariablesetContent } from "@repo/database/schema";
import {
  createAdminProcedureContext,
  createAnonymousProcedureContext,
  createUserProcedureContext,
} from "../../../testing/auth";
import { createMockDeleteDb, createMockSequentialSelectDb, createMockUpdateDb } from "../../../testing/router";
import {
  createVariablesetContent,
  deleteVariablesetContent,
  getVariablesetContents,
  listDatasetVariablesetVariables,
  listVariablesetVariables,
  reorderVariablesetContents,
  updateVariablesetVariableAttributes,
} from "./procedures";

function createMockCreateVariablesetContentDb(row: Record<string, unknown> & { variablesetId: string }) {
  const state = {
    insertTable: undefined as unknown,
    insertValues: undefined as unknown,
    where: undefined as unknown,
  };

  const db = {
    insert(table: unknown) {
      state.insertTable = table;

      return {
        values(values: unknown) {
          state.insertValues = values;

          return {
            async returning() {
              return [row];
            },
          };
        },
      };
    },
    select() {
      return {
        from() {
          return this;
        },
        limit() {
          return this;
        },
        where(where: unknown) {
          state.where = where;
          return this;
        },
        async execute() {
          return [{ datasetId: "550e8400-e29b-41d4-a716-446655440000", id: row.variablesetId }];
        },
      };
    },
  };

  return { db: db as unknown as DatabaseInstance, state };
}

function createMockReorderVariablesetContentsDb(existingIds: string[]) {
  const state = {
    selectWhere: undefined as unknown,
    updates: [] as Array<{ set: unknown; where: unknown }>,
  };

  const db = {
    select() {
      return {
        async where(where: unknown) {
          state.selectWhere = where;
          return existingIds.map((id) => ({ id }));
        },
        from() {
          return this;
        },
      };
    },
    async transaction(
      callback: (tx: {
        update: (table: unknown) => {
          set: (set: unknown) => {
            where: (where: unknown) => Promise<void>;
          };
        };
      }) => Promise<void>
    ) {
      await callback({
        update() {
          return {
            set(set: unknown) {
              return {
                async where(where: unknown) {
                  state.updates.push({ set, where });
                },
              };
            },
          };
        },
      });
    },
  };

  return { db: db as unknown as DatabaseInstance, state };
}

describe("variableset", () => {
  test("returns variableset variables for dataset members", async () => {
    const rows = [
      {
        attributes: { allowedStatistics: { distribution: true, mean: false } },
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        datasetId: "550e8400-e29b-41d4-a716-446655440000",
        id: "550e8400-e29b-41d4-a716-446655440010",
        label: "Age",
        measure: "scale",
        missingRanges: null,
        missingValues: null,
        name: "age",
        orderIndex: 100,
        type: "int32",
        valueLabels: null,
        variableLabels: null,
      },
    ];
    const { db, state } = createMockSequentialSelectDb([
      [{ datasetId: "550e8400-e29b-41d4-a716-446655440000", id: "550e8400-e29b-41d4-a716-446655440005" }],
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440001" }],
      [{ exists: true }],
      rows,
    ]);

    const result = await listVariablesetVariables(createUserProcedureContext(db), {
      id: "550e8400-e29b-41d4-a716-446655440005",
    });

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 1);
    assert.equal(result.limit, 1000);
    assert.equal(result.offset, 0);
    assert.deepEqual(state.limitValues, [1]);
  });

  test("returns variableset contents for dataset members", async () => {
    const contents = [
      {
        attributes: null,
        contentType: "subset",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        id: "550e8400-e29b-41d4-a716-446655440020",
        position: 100,
        subsetCategory: "general",
        subsetDescription: "Nested set",
        subsetId: "550e8400-e29b-41d4-a716-446655440021",
        subsetName: "Age Group",
        updatedAt: null,
        variableId: null,
        variableLabel: null,
        variableMeasure: null,
        variableName: null,
        variableType: null,
        variablesetId: "550e8400-e29b-41d4-a716-446655440005",
      },
    ];
    const { db, state } = createMockSequentialSelectDb([
      [{ datasetId: "550e8400-e29b-41d4-a716-446655440000", id: "550e8400-e29b-41d4-a716-446655440005" }],
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440001" }],
      [{ exists: true }],
      contents,
    ]);

    const result = await getVariablesetContents(createUserProcedureContext(db), {
      id: "550e8400-e29b-41d4-a716-446655440005",
    });

    assert.deepEqual(result, { contents });
    assert.deepEqual(state.limitValues, [1]);
  });

  test("rejects anonymous access to variableset variables", async () => {
    const { db } = createMockSequentialSelectDb([
      [{ datasetId: "550e8400-e29b-41d4-a716-446655440000", id: "550e8400-e29b-41d4-a716-446655440005" }],
    ]);

    await assert.rejects(
      () =>
        listVariablesetVariables(createAnonymousProcedureContext(db), {
          id: "550e8400-e29b-41d4-a716-446655440005",
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "UNAUTHORIZED" &&
        error.status === 401 &&
        error.message === "Missing user session. Please log in!"
    );
  });

  test("rejects non-member access to variableset variables", async () => {
    const { db } = createMockSequentialSelectDb([
      [{ datasetId: "550e8400-e29b-41d4-a716-446655440000", id: "550e8400-e29b-41d4-a716-446655440005" }],
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440001" }],
      [{ exists: false }],
    ]);

    await assert.rejects(
      () =>
        listVariablesetVariables(createUserProcedureContext(db), {
          id: "550e8400-e29b-41d4-a716-446655440005",
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.status === 403 &&
        error.message === "You do not have enough permission to perform this action."
    );
  });

  test("returns unassigned dataset variables when requested", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        datasetId: "550e8400-e29b-41d4-a716-446655440000",
        id: "550e8400-e29b-41d4-a716-446655440010",
        label: "Income",
        measure: "scale",
        missingRanges: null,
        missingValues: null,
        name: "income",
        type: "int32",
        valueLabels: null,
        variableLabels: null,
      },
    ];
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440001" }],
      [{ exists: true }],
      rows,
    ]);

    const result = await listDatasetVariablesetVariables(createUserProcedureContext(db), {
      id: "550e8400-e29b-41d4-a716-446655440000",
      limit: 10,
      offset: 0,
      setId: "550e8400-e29b-41d4-a716-446655440005",
      unassigned: "true",
    });

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 1);
    assert.equal(result.limit, 10);
    assert.equal(result.offset, 0);
  });

  test("returns not found for dataset and variableset mismatches", async () => {
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440001" }],
      [{ datasetId: "550e8400-e29b-41d4-a716-446655440999", id: "550e8400-e29b-41d4-a716-446655440005" }],
      [{ exists: true }],
    ]);

    await assert.rejects(
      () =>
        listDatasetVariablesetVariables(createAdminProcedureContext(db), {
          id: "550e8400-e29b-41d4-a716-446655440000",
          limit: 10,
          offset: 0,
          setId: "550e8400-e29b-41d4-a716-446655440005",
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Variableset not found in dataset"
    );
  });

  test("creates variableset variable content for admins", async () => {
    const row = {
      attributes: { allowedStatistics: { distribution: true, mean: false } },
      contentType: "variable",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      id: "550e8400-e29b-41d4-a716-446655440020",
      position: 100,
      subsetId: null,
      updatedAt: null,
      variableId: "550e8400-e29b-41d4-a716-446655440010",
      variablesetId: "550e8400-e29b-41d4-a716-446655440005",
    };
    const { db, state } = createMockCreateVariablesetContentDb(row);

    const result = await createVariablesetContent(createAdminProcedureContext(db), {
      body: {
        attributes: null,
        contentType: "variable",
        referenceId: row.variableId,
      },
      params: {
        id: row.variablesetId,
      },
    });

    assert.deepEqual(result, row);
    assert.equal(state.insertTable, datasetVariablesetContent);
    assert.deepEqual(state.insertValues, {
      attributes: { allowedStatistics: { distribution: true, mean: false } },
      contentType: "variable",
      position: 0,
      subsetId: null,
      variableId: row.variableId,
      variablesetId: row.variablesetId,
    });
    assert.notEqual(state.where, undefined);
  });

  test("updates variableset variable attributes for admins", async () => {
    const input = {
      body: {
        allowedStatistics: { distribution: true, mean: true },
        valueRange: { max: 10, min: 0 },
      },
      params: {
        id: "550e8400-e29b-41d4-a716-446655440005",
        variableId: "550e8400-e29b-41d4-a716-446655440010",
      },
    };
    const row = {
      attributes: input.body,
      contentType: "variable",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      id: "550e8400-e29b-41d4-a716-446655440020",
      position: 100,
      subsetId: null,
      updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      variableId: input.params.variableId,
      variablesetId: input.params.id,
    };
    const { db, state } = createMockUpdateDb(row);

    const result = await updateVariablesetVariableAttributes(createAdminProcedureContext(db), input);

    assert.deepEqual(result, row);
    assert.equal(state.table, datasetVariablesetContent);
    assert.notEqual(state.where, undefined);
    assert.equal(typeof state.set, "object");
    assert.deepEqual((state.set as { attributes: unknown }).attributes, input.body);
    assert.ok((state.set as { updatedAt: unknown }).updatedAt instanceof Date);
  });

  test("returns not found when variableset variable attributes are missing", async () => {
    const { db } = createMockUpdateDb(undefined);

    await assert.rejects(
      () =>
        updateVariablesetVariableAttributes(createAdminProcedureContext(db), {
          body: {
            allowedStatistics: { distribution: true, mean: true },
          },
          params: {
            id: "550e8400-e29b-41d4-a716-446655440005",
            variableId: "550e8400-e29b-41d4-a716-446655440010",
          },
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Variableset variable content not found"
    );
  });

  test("deletes variableset content for admins", async () => {
    const { db, state } = createMockDeleteDb(undefined);

    const result = await deleteVariablesetContent(createAdminProcedureContext(db), {
      contentId: "550e8400-e29b-41d4-a716-446655440020",
      id: "550e8400-e29b-41d4-a716-446655440005",
    });

    assert.deepEqual(result, { success: true });
    assert.equal(state.table, datasetVariablesetContent);
    assert.notEqual(state.where, undefined);
  });

  test("reorders variableset contents for admins", async () => {
    const contentIds = ["550e8400-e29b-41d4-a716-446655440020", "550e8400-e29b-41d4-a716-446655440021"];
    const { db, state } = createMockReorderVariablesetContentsDb(contentIds);

    const result = await reorderVariablesetContents(createAdminProcedureContext(db), {
      body: {
        contentIds: [...contentIds].reverse(),
      },
      params: {
        id: "550e8400-e29b-41d4-a716-446655440005",
      },
    });

    assert.deepEqual(result, { success: true });
    assert.notEqual(state.selectWhere, undefined);
    assert.equal(state.updates.length, 2);
    assert.deepEqual(
      state.updates.map((update) => (update.set as { position: number }).position),
      [0, 100]
    );
  });

  test("rejects invalid variableset content reorder payloads", async () => {
    const { db } = createMockReorderVariablesetContentsDb([
      "550e8400-e29b-41d4-a716-446655440020",
      "550e8400-e29b-41d4-a716-446655440021",
    ]);

    await assert.rejects(
      () =>
        reorderVariablesetContents(createAdminProcedureContext(db), {
          body: {
            contentIds: ["550e8400-e29b-41d4-a716-446655440020"],
          },
          params: {
            id: "550e8400-e29b-41d4-a716-446655440005",
          },
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "BAD_REQUEST" &&
        error.status === 400 &&
        error.message === "contentIds must exactly match the existing content IDs for this variable set"
    );
  });

  test("rejects anonymous access to variableset content creation", async () => {
    const { db } = createMockDeleteDb(undefined);

    await assert.rejects(
      () =>
        createVariablesetContent(createAnonymousProcedureContext(db), {
          body: {
            contentType: "variable",
            referenceId: "550e8400-e29b-41d4-a716-446655440010",
          },
          params: {
            id: "550e8400-e29b-41d4-a716-446655440005",
          },
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "UNAUTHORIZED" &&
        error.status === 401 &&
        error.message === "Missing user session. Please log in!"
    );
  });

  test("rejects authenticated non-admin variableset content creation", async () => {
    const { db } = createMockDeleteDb(undefined);

    await assert.rejects(
      () =>
        createVariablesetContent(createUserProcedureContext(db), {
          body: {
            contentType: "variable",
            referenceId: "550e8400-e29b-41d4-a716-446655440010",
          },
          params: {
            id: "550e8400-e29b-41d4-a716-446655440005",
          },
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.status === 403 &&
        error.message === "You do not have enough permission to perform this action."
    );
  });
});
