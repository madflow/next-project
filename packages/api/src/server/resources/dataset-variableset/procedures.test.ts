import { ORPCError } from "@orpc/server";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { DatabaseInstance } from "@repo/database/clients";
import { datasetVariablesetContent, datasetVariableset as datasetVariablesetTable } from "@repo/database/schema";
import {
  createAdminProcedureContext,
  createAnonymousProcedureContext,
  createUserProcedureContext,
} from "../../../testing/auth";
import { createMockDeleteDb, createMockInsertDb, createMockUpdateDb } from "../../../testing/router";
import {
  createDatasetVariableset,
  deleteDatasetVariableset,
  detachDatasetVariableset,
  reorderDatasetVariablesets,
  updateDatasetVariableset,
} from "./procedures";

function createMockCreateDatasetVariablesetWithParentDb(
  row: Record<string, unknown> & { id: string; parentId: string }
) {
  const state = {
    insertCalls: [] as Array<{
      table: unknown;
      values: unknown;
    }>,
    transactionCalls: 0,
    where: undefined as unknown,
  };

  const tx = {
    insert(table: unknown) {
      return {
        values(values: unknown) {
          state.insertCalls.push({ table, values });

          if (state.insertCalls.length === 1) {
            return {
              async returning() {
                return [row];
              },
            };
          }

          return {};
        },
      };
    },
    select() {
      return {
        from() {
          return this;
        },
        async where(where: unknown) {
          state.where = where;
          return [{ maxPos: 200 }];
        },
      };
    },
  };

  const db = {
    async transaction(
      callback: (tx: {
        insert: (table: unknown) => {
          values: (values: unknown) => {
            returning?: () => Promise<Array<Record<string, unknown> & { id: string; parentId: string }>>;
          };
        };
        select: () => {
          from: () => {
            where: (where: unknown) => Promise<Array<{ maxPos: number }>>;
          };
        };
      }) => Promise<unknown>
    ) {
      state.transactionCalls += 1;
      return callback(tx);
    },
  };

  return {
    db: db as unknown as DatabaseInstance,
    state,
  };
}

function createMockReorderDatasetVariablesetsDb(existingIds: string[]) {
  const state = {
    selectWhere: undefined as unknown,
    updates: [] as Array<{ set: unknown; where: unknown }>,
  };

  const db = {
    select() {
      return {
        from() {
          return this;
        },
        where(where: unknown) {
          state.selectWhere = where;
          return this;
        },
        async execute() {
          return existingIds.map((id) => ({ id }));
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

function createMockDetachDatasetVariablesetDb() {
  const state = {
    deletes: [] as Array<{ table: unknown; where: unknown }>,
    updates: [] as Array<{ table: unknown; set: unknown; where: unknown }>,
  };

  const db = {
    async transaction(
      callback: (tx: {
        delete: (table: unknown) => {
          where: (where: unknown) => Promise<void>;
        };
        update: (table: unknown) => {
          set: (set: unknown) => {
            where: (where: unknown) => Promise<void>;
          };
        };
      }) => Promise<void>
    ) {
      await callback({
        delete(table: unknown) {
          return {
            async where(where: unknown) {
              state.deletes.push({ table, where });
            },
          };
        },
        update(table: unknown) {
          return {
            set(set: unknown) {
              return {
                async where(where: unknown) {
                  state.updates.push({ set, table, where });
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

describe("dataset variableset mutations", () => {
  test("creates child variablesets for admins and links them to their parent contents", async () => {
    const input = {
      category: "general" as const,
      datasetId: "550e8400-e29b-41d4-a716-446655440000",
      description: "Child set",
      name: "Follow-up",
      orderIndex: 0,
      parentId: "550e8400-e29b-41d4-a716-446655440011",
    };
    const row = {
      attributes: null,
      category: input.category,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      datasetId: input.datasetId,
      description: input.description,
      id: "550e8400-e29b-41d4-a716-446655440010",
      name: input.name,
      orderIndex: input.orderIndex,
      parentId: input.parentId,
      updatedAt: null,
    };
    const { db, state } = createMockCreateDatasetVariablesetWithParentDb({
      ...row,
    });

    const result = await createDatasetVariableset(createAdminProcedureContext(db), input);

    assert.deepEqual(result, row);
    assert.equal(state.insertCalls[0]?.table, datasetVariablesetTable);
    assert.deepEqual(state.insertCalls[0]?.values, input);
    assert.equal(state.insertCalls[1]?.table, datasetVariablesetContent);
    assert.deepEqual(state.insertCalls[1]?.values, {
      contentType: "subset",
      position: 300,
      subsetId: row.id,
      variablesetId: input.parentId,
    });
    assert.equal(state.transactionCalls, 1);
    assert.notEqual(state.where, undefined);
  });

  test("updates and returns the dataset variableset for admins", async () => {
    const input = {
      body: {
        name: "Updated set",
      },
      params: {
        id: "550e8400-e29b-41d4-a716-446655440010",
      },
    };
    const row = {
      attributes: null,
      category: "general",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      datasetId: "550e8400-e29b-41d4-a716-446655440000",
      description: null,
      id: input.params.id,
      name: input.body.name,
      orderIndex: 0,
      parentId: null,
      updatedAt: null,
    };
    const { db, state } = createMockUpdateDb(row);

    const result = await updateDatasetVariableset(createAdminProcedureContext(db), input);

    assert.deepEqual(result, row);
    assert.equal(state.table, datasetVariablesetTable);
    assert.deepEqual(state.set, input.body);
    assert.notEqual(state.where, undefined);
  });

  test("maps missing dataset variablesets on update to not found errors", async () => {
    const { db } = createMockUpdateDb(undefined);

    await assert.rejects(
      () =>
        updateDatasetVariableset(createAdminProcedureContext(db), {
          body: { name: "Updated set" },
          params: { id: "550e8400-e29b-41d4-a716-446655440010" },
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Variableset not found"
    );
  });

  test("deletes and returns the removed dataset variableset for admins", async () => {
    const row = {
      attributes: null,
      category: "general",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      datasetId: "550e8400-e29b-41d4-a716-446655440000",
      description: null,
      id: "550e8400-e29b-41d4-a716-446655440010",
      name: "Demographics",
      orderIndex: 0,
      parentId: null,
      updatedAt: null,
    };
    const { db, state } = createMockDeleteDb(row);

    const result = await deleteDatasetVariableset(createAdminProcedureContext(db), { id: row.id });

    assert.deepEqual(result, row);
    assert.equal(state.table, datasetVariablesetTable);
    assert.notEqual(state.where, undefined);
  });

  test("maps missing dataset variablesets on delete to not found errors", async () => {
    const { db } = createMockDeleteDb(undefined);

    await assert.rejects(
      () => deleteDatasetVariableset(createAdminProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440010" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Variableset not found"
    );
  });

  test("rejects anonymous access to dataset variableset update", async () => {
    const { db } = createMockUpdateDb(undefined);

    await assert.rejects(
      () =>
        updateDatasetVariableset(createAnonymousProcedureContext(db), {
          body: { name: "Updated set" },
          params: { id: "550e8400-e29b-41d4-a716-446655440010" },
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "UNAUTHORIZED" &&
        error.message === "Missing user session. Please log in!"
    );
  });

  test("rejects authenticated non-admin dataset variableset update", async () => {
    const { db } = createMockUpdateDb(undefined);

    await assert.rejects(
      () =>
        updateDatasetVariableset(createUserProcedureContext(db), {
          body: { name: "Updated set" },
          params: { id: "550e8400-e29b-41d4-a716-446655440010" },
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.message === "You do not have enough permission to perform this action."
    );
  });

  test("rejects anonymous access to dataset variableset creation", async () => {
    const { db } = createMockInsertDb({ id: "550e8400-e29b-41d4-a716-446655440010" });

    await assert.rejects(
      () =>
        createDatasetVariableset(createAnonymousProcedureContext(db), {
          category: "general",
          datasetId: "550e8400-e29b-41d4-a716-446655440000",
          description: null,
          name: "Demographics",
          orderIndex: 0,
          parentId: null,
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "UNAUTHORIZED" &&
        error.message === "Missing user session. Please log in!"
    );
  });

  test("rejects authenticated non-admin dataset variableset creation", async () => {
    const { db } = createMockInsertDb({ id: "550e8400-e29b-41d4-a716-446655440010" });

    await assert.rejects(
      () =>
        createDatasetVariableset(createUserProcedureContext(db), {
          category: "general",
          datasetId: "550e8400-e29b-41d4-a716-446655440000",
          description: null,
          name: "Demographics",
          orderIndex: 0,
          parentId: null,
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.message === "You do not have enough permission to perform this action."
    );
  });

  test("rejects anonymous access to dataset variableset deletion", async () => {
    const { db } = createMockDeleteDb(undefined);

    await assert.rejects(
      () =>
        deleteDatasetVariableset(createAnonymousProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440010" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "UNAUTHORIZED" &&
        error.message === "Missing user session. Please log in!"
    );
  });

  test("rejects authenticated non-admin dataset variableset deletion", async () => {
    const { db } = createMockDeleteDb(undefined);

    await assert.rejects(
      () => deleteDatasetVariableset(createUserProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440010" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.message === "You do not have enough permission to perform this action."
    );
  });

  test("reorders dataset variablesets for admins", async () => {
    const existingIds = ["550e8400-e29b-41d4-a716-446655440010", "550e8400-e29b-41d4-a716-446655440011"];
    const { db, state } = createMockReorderDatasetVariablesetsDb(existingIds);

    const result = await reorderDatasetVariablesets(createAdminProcedureContext(db), {
      datasetId: "550e8400-e29b-41d4-a716-446655440000",
      parentId: null,
      reorderedIds: [...existingIds].reverse(),
    });

    assert.deepEqual(result, { success: true });
    assert.notEqual(state.selectWhere, undefined);
    assert.equal(state.updates.length, 2);
    assert.deepEqual(
      state.updates.map((update) => (update.set as { orderIndex: number }).orderIndex),
      [0, 1]
    );
  });

  test("rejects dataset variableset reorder ids outside the selected parent", async () => {
    const { db } = createMockReorderDatasetVariablesetsDb([
      "550e8400-e29b-41d4-a716-446655440010",
      "550e8400-e29b-41d4-a716-446655440011",
    ]);

    await assert.rejects(
      () =>
        reorderDatasetVariablesets(createAdminProcedureContext(db), {
          datasetId: "550e8400-e29b-41d4-a716-446655440000",
          parentId: null,
          reorderedIds: ["550e8400-e29b-41d4-a716-446655440099"],
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "BAD_REQUEST" &&
        error.status === 400 &&
        error.message === "Some variablesets do not belong to the specified parent"
    );
  });

  test("rejects dataset variableset reorder payloads with duplicate ids", async () => {
    const duplicateId = "550e8400-e29b-41d4-a716-446655440010";
    const { db } = createMockReorderDatasetVariablesetsDb([duplicateId, "550e8400-e29b-41d4-a716-446655440011"]);

    await assert.rejects(
      () =>
        reorderDatasetVariablesets(createAdminProcedureContext(db), {
          datasetId: "550e8400-e29b-41d4-a716-446655440000",
          parentId: null,
          reorderedIds: [duplicateId, duplicateId],
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "BAD_REQUEST" &&
        error.status === 400 &&
        error.message === "reorderedIds must not contain duplicate variableset IDs"
    );
  });

  test("rejects dataset variableset reorder payloads missing sibling ids", async () => {
    const { db } = createMockReorderDatasetVariablesetsDb([
      "550e8400-e29b-41d4-a716-446655440010",
      "550e8400-e29b-41d4-a716-446655440011",
    ]);

    await assert.rejects(
      () =>
        reorderDatasetVariablesets(createAdminProcedureContext(db), {
          datasetId: "550e8400-e29b-41d4-a716-446655440000",
          parentId: null,
          reorderedIds: ["550e8400-e29b-41d4-a716-446655440010"],
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "BAD_REQUEST" &&
        error.status === 400 &&
        error.message === "reorderedIds must include every sibling variableset exactly once"
    );
  });

  test("detaches dataset variablesets for admins", async () => {
    const { db, state } = createMockDetachDatasetVariablesetDb();

    const result = await detachDatasetVariableset(createAdminProcedureContext(db), {
      id: "550e8400-e29b-41d4-a716-446655440010",
    });

    assert.deepEqual(result, { success: true });
    assert.equal(state.deletes.length, 1);
    assert.equal(state.deletes[0]?.table, datasetVariablesetContent);
    assert.equal(state.updates.length, 1);
    assert.equal(state.updates[0]?.table, datasetVariablesetTable);
    assert.equal((state.updates[0]?.set as { parentId: string | null }).parentId, null);
    assert.ok((state.updates[0]?.set as { updatedAt: unknown }).updatedAt instanceof Date);
  });

  test("rejects anonymous dataset variableset reorder", async () => {
    const { db } = createMockReorderDatasetVariablesetsDb([]);

    await assert.rejects(
      () =>
        reorderDatasetVariablesets(createAnonymousProcedureContext(db), {
          datasetId: "550e8400-e29b-41d4-a716-446655440000",
          parentId: null,
          reorderedIds: [],
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "UNAUTHORIZED" &&
        error.message === "Missing user session. Please log in!"
    );
  });

  test("rejects non-admin dataset variableset reorder", async () => {
    const { db } = createMockReorderDatasetVariablesetsDb([]);

    await assert.rejects(
      () =>
        reorderDatasetVariablesets(createUserProcedureContext(db), {
          datasetId: "550e8400-e29b-41d4-a716-446655440000",
          parentId: null,
          reorderedIds: [],
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.message === "You do not have enough permission to perform this action."
    );
  });

  test("rejects anonymous dataset variableset detach", async () => {
    const { db } = createMockDetachDatasetVariablesetDb();

    await assert.rejects(
      () =>
        detachDatasetVariableset(createAnonymousProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440010" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "UNAUTHORIZED" &&
        error.message === "Missing user session. Please log in!"
    );
  });

  test("rejects non-admin dataset variableset detach", async () => {
    const { db } = createMockDetachDatasetVariablesetDb();

    await assert.rejects(
      () => detachDatasetVariableset(createUserProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440010" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.message === "You do not have enough permission to perform this action."
    );
  });
});
