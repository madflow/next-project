import { ORPCError } from "@orpc/server";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  createAdminProcedureContext,
  createAnonymousProcedureContext,
  createUserProcedureContext,
} from "../../../testing/auth";
import { createMockListDb, createMockSequentialSelectDb } from "../../../testing/router";
import { getDataset, listDatasetVariables, listDatasets } from "./procedures";

describe("listDatasets", () => {
  test("returns paginated rows with validated scalar filters", async () => {
    const rows = [
      {
        id: "dataset_1",
        name: "Acme Dataset",
        filename: "acme.csv",
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
      },
    ];
    const { db, state } = createMockListDb(rows, 42);

    const result = await listDatasets(createUserProcedureContext(db), {
      limit: "5",
      name: "ilike.*acme*",
      offset: "2",
      order: "name.asc",
    });

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 42);
    assert.equal(result.limit, 5);
    assert.equal(result.offset, 2);
    assert.deepEqual(result.orderBy, [{ direction: "asc", field: "name" }]);
    assert.equal(state.orderBy.length, 1);
    assert.notEqual(state.rowWhere, undefined);
    assert.notEqual(state.countWhere, undefined);
    assert.equal(state.offset, 2);
  });

  test("searches across configured dataset fields without joins", async () => {
    const rows = [
      {
        id: "dataset_1",
        name: "Acme Dataset",
        filename: "acme.csv",
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
      },
    ];
    const { db, state } = createMockListDb(rows, 1);

    const result = await listDatasets(createUserProcedureContext(db), { search: "acme" });

    assert.deepEqual(result.rows, rows);
    assert.equal(state.joinCount, 0);
    assert.notEqual(state.rowWhere, undefined);
  });

  test("embeds organization when requested", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        description: null,
        fileHash: "hash_1",
        filename: "acme.csv",
        fileSize: 123,
        fileType: "csv",
        id: "dataset_1",
        name: "Acme Dataset",
        organization: {
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          id: "550e8400-e29b-41d4-a716-446655440000",
          logo: null,
          metadata: null,
          name: "Acme Org",
          settings: null,
          slug: "acme-org",
        },
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        storageKey: "datasets/acme.csv",
        updatedAt: null,
        uploadedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ];
    const { db, state } = createMockListDb(rows, 1);

    const result = await listDatasets(createUserProcedureContext(db), {
      embed: "organization",
      order: "organization:name.asc",
    });

    assert.deepEqual(result.rows, rows);
    assert.deepEqual(result.orderBy, [{ direction: "asc", field: "name", relationship: "organization" }]);
    assert.equal(state.joinCount, 2);
    assert.notEqual(state.rowSelection, undefined);
  });

  test("joins organization for relationship filters without embedding it", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        description: null,
        fileHash: "hash_1",
        filename: "acme.csv",
        fileSize: 123,
        fileType: "csv",
        id: "dataset_1",
        name: "Acme Dataset",
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        storageKey: "datasets/acme.csv",
        updatedAt: null,
        uploadedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ];
    const { db, state } = createMockListDb(rows, 1);

    const result = await listDatasets(createUserProcedureContext(db), { "organization:name": "eq.Acme Org" });

    assert.deepEqual(result.rows, rows);
    assert.equal(state.joinCount, 2);
  });

  test("maps unknown embeds to oRPC input errors", async () => {
    const { db } = createMockListDb([], 0);

    await assert.rejects(
      () => listDatasets(createUserProcedureContext(db), { embed: "owner" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "INPUT_VALIDATION_FAILED" &&
        error.status === 422 &&
        error.message.includes("Unknown embed 'owner'")
    );
  });

  test("rejects anonymous access to dataset listing", async () => {
    const { db } = createMockListDb([], 0);

    await assert.rejects(
      () => listDatasets(createAnonymousProcedureContext(db), {}),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "UNAUTHORIZED" &&
        error.status === 401 &&
        error.message === "Missing user session. Please log in!"
    );
  });

  test("allows admins to list all datasets without membership lookup", async () => {
    const rows = [
      {
        id: "dataset_1",
        name: "Acme Dataset",
        filename: "acme.csv",
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
      },
    ];
    const { db, state } = createMockListDb(rows, 1);

    const result = await listDatasets(createAdminProcedureContext(db), {});

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 1);
    assert.equal(state.joinCount, 0);
  });

  test("returns an empty list for users without organization memberships", async () => {
    const { db } = createMockListDb([], 0);

    const result = await listDatasets(createUserProcedureContext(db), {});

    assert.deepEqual(result.rows, []);
    assert.equal(result.count, 0);
  });
});

describe("getDataset", () => {
  test("returns a dataset with embedded organization when requested", async () => {
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      description: null,
      fileHash: "hash_1",
      filename: "acme.csv",
      fileSize: 123,
      fileType: "csv",
      id: "dataset_1",
      name: "Acme Dataset",
      organization: {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        id: "550e8400-e29b-41d4-a716-446655440000",
        logo: null,
        metadata: null,
        name: "Acme Org",
        settings: null,
        slug: "acme-org",
      },
      organizationId: "550e8400-e29b-41d4-a716-446655440000",
      storageKey: "datasets/acme.csv",
      updatedAt: null,
      uploadedAt: new Date("2024-01-01T00:00:00.000Z"),
    };
    const { db, state } = createMockSequentialSelectDb([[row], [{ exists: true }]]);

    const result = await getDataset(createUserProcedureContext(db), {
      embed: "organization",
      id: row.id,
    });

    assert.deepEqual(result, row);
    assert.equal(state.whereValues.length, 2);
    assert.deepEqual(state.limitValues, [1]);
  });

  test("returns not found when the dataset does not exist", async () => {
    const { db } = createMockSequentialSelectDb([[]]);

    await assert.rejects(
      () => getDataset(createAdminProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440001" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Dataset not found"
    );
  });

  test("rejects anonymous access to a dataset", async () => {
    const { db } = createMockSequentialSelectDb([]);

    await assert.rejects(
      () => getDataset(createAnonymousProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440001" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "UNAUTHORIZED" &&
        error.status === 401 &&
        error.message === "Missing user session. Please log in!"
    );
  });

  test("rejects non-member access to a dataset", async () => {
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      description: null,
      fileHash: "hash_1",
      filename: "acme.csv",
      fileSize: 123,
      fileType: "csv",
      id: "dataset_1",
      name: "Acme Dataset",
      organizationId: "550e8400-e29b-41d4-a716-446655440000",
      storageKey: "datasets/acme.csv",
      updatedAt: null,
      uploadedAt: new Date("2024-01-01T00:00:00.000Z"),
    };
    const { db } = createMockSequentialSelectDb([[row], [{ exists: false }]]);

    await assert.rejects(
      () => getDataset(createUserProcedureContext(db), { id: row.id }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.status === 403 &&
        error.message === "You do not have enough permission to perform this action."
    );
  });
});

describe("listDatasetVariables", () => {
  test("returns dataset variables for dataset members", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        datasetId: "550e8400-e29b-41d4-a716-446655440000",
        id: "variable_1",
        label: "Age",
        measure: "scale",
        missingRanges: null,
        missingValues: null,
        name: "age",
        type: "int32",
        valueLabels: null,
        variableLabels: null,
      },
    ];
    const { db, state } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: true }],
      rows,
      [{ count: 1 }],
    ]);

    const result = await listDatasetVariables(createUserProcedureContext(db), {
      id: "550e8400-e29b-41d4-a716-446655440000",
      limit: "5",
      offset: "2",
      order: "name.asc",
      search: "age",
    });

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 1);
    assert.equal(result.limit, 5);
    assert.equal(result.offset, 2);
    assert.deepEqual(result.orderBy, [{ direction: "asc", field: "name" }]);
    assert.equal(state.whereValues.length, 4);
    assert.deepEqual(state.limitValues, [5]);
    assert.deepEqual(state.offsets, [2]);
  });

  test("allows admins to list dataset variables without membership", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        datasetId: "550e8400-e29b-41d4-a716-446655440000",
        id: "variable_1",
        label: "Age",
        measure: "scale",
        missingRanges: null,
        missingValues: null,
        name: "age",
        type: "int32",
        valueLabels: null,
        variableLabels: null,
      },
    ];
    const { db, state } = createMockListDb(rows, 1);

    const result = await listDatasetVariables(createAdminProcedureContext(db), {
      id: "550e8400-e29b-41d4-a716-446655440000",
    });

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 1);
    assert.notEqual(state.rowWhere, undefined);
    assert.notEqual(state.countWhere, undefined);
  });

  test("rejects anonymous access to dataset variables", async () => {
    const { db } = createMockSequentialSelectDb([]);

    await assert.rejects(
      () => listDatasetVariables(createAnonymousProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440000" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "UNAUTHORIZED" &&
        error.status === 401 &&
        error.message === "Missing user session. Please log in!"
    );
  });

  test("rejects non-member access to dataset variables", async () => {
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: false }],
    ]);

    await assert.rejects(
      () => listDatasetVariables(createUserProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440000" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.status === 403 &&
        error.message === "You do not have enough permission to perform this action."
    );
  });
});
