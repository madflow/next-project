import { ORPCError } from "@orpc/server";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  createAdminProcedureContext,
  createAnonymousProcedureContext,
  createUserProcedureContext,
} from "../../../testing/auth";
import { createMockSequentialSelectDb } from "../../../testing/router";
import { getVariablesetContents, listDatasetVariablesetVariables, listVariablesetVariables } from "./procedures";

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
});
