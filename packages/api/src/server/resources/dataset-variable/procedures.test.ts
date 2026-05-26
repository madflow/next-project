import { ORPCError } from "@orpc/server";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createAdminProcedureContext, createUserProcedureContext } from "../../../testing/auth";
import { createMockGetDb, createMockSequentialSelectDb } from "../../../testing/router";
import { getDatasetVariable } from "./procedures";

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
      type: "numeric",
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
      type: "numeric",
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
