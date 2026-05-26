import { ORPCError } from "@orpc/server";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { datasetVariable as datasetVariableTable } from "@repo/database/schema";
import {
  createAdminProcedureContext,
  createAnonymousProcedureContext,
  createUserProcedureContext,
} from "../../../testing/auth";
import {
  createMockDeleteDb,
  createMockGetDb,
  createMockSequentialSelectDb,
  createMockUpdateDb,
} from "../../../testing/router";
import { deleteDatasetVariable, getDatasetVariable, updateDatasetVariable } from "./procedures";

describe("getDatasetVariable", () => {
  test("returns the dataset variable for admins without membership lookup", async () => {
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      datasetId: "550e8400-e29b-41d4-a716-446655440000",
      id: "550e8400-e29b-41d4-a716-446655440010",
      label: "Age",
      measure: "scale",
      missingRanges: null,
      missingValues: null,
      name: "age",
      type: "int32",
      valueLabels: null,
      variableLabels: null,
    };
    const { db, state } = createMockGetDb(row);

    const result = await getDatasetVariable(createAdminProcedureContext(db), { id: row.id });

    assert.deepEqual(result, row);
    assert.equal(state.joinCount, 0);
    assert.equal(state.limit, 1);
    assert.notEqual(state.where, undefined);
  });

  test("returns the dataset variable for members with scoped access", async () => {
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      datasetId: "550e8400-e29b-41d4-a716-446655440000",
      id: "550e8400-e29b-41d4-a716-446655440010",
      label: "Age",
      measure: "scale",
      missingRanges: null,
      missingValues: null,
      name: "age",
      type: "int32",
      valueLabels: null,
      variableLabels: null,
    };
    const { db, state } = createMockSequentialSelectDb([[row]]);

    const result = await getDatasetVariable(createUserProcedureContext(db), { id: row.id });

    assert.deepEqual(result, row);
    assert.equal(state.limitValues[0], 1);
    assert.notEqual(state.whereValues[0], undefined);
  });

  test("returns not found when the dataset variable does not exist", async () => {
    const { db } = createMockGetDb(undefined);

    await assert.rejects(
      () => getDatasetVariable(createAdminProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440010" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Dataset variable not found"
    );
  });
});

describe("dataset variable mutations", () => {
  test("updates and returns the dataset variable for admins", async () => {
    const input: {
      body: { measure: "ordinal" };
      params: { id: string };
    } = {
      body: {
        measure: "ordinal",
      },
      params: {
        id: "550e8400-e29b-41d4-a716-446655440010",
      },
    };
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      datasetId: "550e8400-e29b-41d4-a716-446655440000",
      id: input.params.id,
      label: "Age",
      measure: input.body.measure,
      missingRanges: null,
      missingValues: null,
      name: "age",
      type: "int32",
      valueLabels: null,
      variableLabels: null,
    };
    const { db, state } = createMockUpdateDb(row);

    const result = await updateDatasetVariable(createAdminProcedureContext(db), input);

    assert.deepEqual(result, row);
    assert.equal(state.table, datasetVariableTable);
    assert.deepEqual(state.set, input.body);
    assert.notEqual(state.where, undefined);
  });

  test("maps missing dataset variables on update to not found errors", async () => {
    const { db } = createMockUpdateDb(undefined);

    await assert.rejects(
      () =>
        updateDatasetVariable(createAdminProcedureContext(db), {
          body: { measure: "ordinal" },
          params: { id: "550e8400-e29b-41d4-a716-446655440010" },
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Dataset variable not found"
    );
  });

  test("deletes and returns the removed dataset variable for admins", async () => {
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      datasetId: "550e8400-e29b-41d4-a716-446655440000",
      id: "550e8400-e29b-41d4-a716-446655440010",
      label: "Age",
      measure: "scale",
      missingRanges: null,
      missingValues: null,
      name: "age",
      type: "int32",
      valueLabels: null,
      variableLabels: null,
    };
    const { db, state } = createMockDeleteDb(row);

    const result = await deleteDatasetVariable(createAdminProcedureContext(db), { id: row.id });

    assert.deepEqual(result, row);
    assert.equal(state.table, datasetVariableTable);
    assert.notEqual(state.where, undefined);
  });

  test("maps missing dataset variables on delete to not found errors", async () => {
    const { db } = createMockDeleteDb(undefined);

    await assert.rejects(
      () => deleteDatasetVariable(createAdminProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440010" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Dataset variable not found"
    );
  });

  test("rejects anonymous access to dataset variable update", async () => {
    const { db } = createMockUpdateDb(undefined);

    await assert.rejects(
      () =>
        updateDatasetVariable(createAnonymousProcedureContext(db), {
          body: { measure: "ordinal" },
          params: { id: "550e8400-e29b-41d4-a716-446655440010" },
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "UNAUTHORIZED" &&
        error.message === "Missing user session. Please log in!"
    );
  });

  test("rejects authenticated non-admin dataset variable update", async () => {
    const { db } = createMockUpdateDb(undefined);

    await assert.rejects(
      () =>
        updateDatasetVariable(createUserProcedureContext(db), {
          body: { measure: "ordinal" },
          params: { id: "550e8400-e29b-41d4-a716-446655440010" },
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.message === "You do not have enough permission to perform this action."
    );
  });
});
