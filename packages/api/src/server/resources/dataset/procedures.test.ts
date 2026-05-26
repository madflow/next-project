import { ORPCError } from "@orpc/server";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  createAdminProcedureContext,
  createAnonymousProcedureContext,
  createUserProcedureContext,
} from "../../../testing/auth";
import {
  createMockDeleteDb,
  createMockInsertDb,
  createMockListDb,
  createMockSequentialSelectDb,
  createMockUpdateDb,
} from "../../../testing/router";
import {
  createDatasetProject,
  createDatasetSplitVariable,
  deleteDataset,
  deleteDatasetSplitVariable,
  getDataset,
  listDatasetAvailableSplitVariables,
  listDatasetProjects,
  listDatasetSplitVariables,
  listDatasetUnassignedVariables,
  listDatasetVariables,
  listDatasetVariablesets,
  listDatasets,
  updateDataset,
} from "./procedures";

describe("listDatasets", () => {
  test("returns paginated rows with validated scalar filters", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        description: null,
        fileHash: "hash_1",
        fileSize: 123,
        fileType: "csv",
        id: "550e8400-e29b-41d4-a716-446655440010",
        name: "Acme Dataset",
        filename: "acme.csv",
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        storageKey: "datasets/acme.csv",
        updatedAt: null,
        uploadedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ];
    const { db, state } = createMockListDb(rows, 42);

    const result = await listDatasets(createAdminProcedureContext(db), {
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
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        description: null,
        fileHash: "hash_1",
        fileSize: 123,
        fileType: "csv",
        id: "550e8400-e29b-41d4-a716-446655440010",
        name: "Acme Dataset",
        filename: "acme.csv",
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        storageKey: "datasets/acme.csv",
        updatedAt: null,
        uploadedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ];
    const { db, state } = createMockListDb(rows, 1);

    const result = await listDatasets(createAdminProcedureContext(db), { search: "acme" });

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
        id: "550e8400-e29b-41d4-a716-446655440010",
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

    const result = await listDatasets(createAdminProcedureContext(db), {
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
        id: "550e8400-e29b-41d4-a716-446655440010",
        name: "Acme Dataset",
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        storageKey: "datasets/acme.csv",
        updatedAt: null,
        uploadedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ];
    const { db, state } = createMockListDb(rows, 1);

    const result = await listDatasets(createAdminProcedureContext(db), { "organization:name": "eq.Acme Org" });

    assert.deepEqual(result.rows, rows);
    assert.equal(state.joinCount, 2);
  });

  test("maps unknown embeds to oRPC input errors", async () => {
    const { db } = createMockListDb([], 0);

    await assert.rejects(
      () => listDatasets(createAdminProcedureContext(db), { embed: "owner" }),
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

  test("rejects non-admin access to dataset listing", async () => {
    const { db } = createMockListDb([], 0);

    await assert.rejects(
      () => listDatasets(createUserProcedureContext(db), {}),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.status === 403 &&
        error.message === "You do not have enough permission to perform this action."
    );
  });

  test("allows admins to list all datasets without membership lookup", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        description: null,
        fileHash: "hash_1",
        fileSize: 123,
        fileType: "csv",
        id: "550e8400-e29b-41d4-a716-446655440010",
        name: "Acme Dataset",
        filename: "acme.csv",
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        storageKey: "datasets/acme.csv",
        updatedAt: null,
        uploadedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ];
    const { db, state } = createMockListDb(rows, 1);

    const result = await listDatasets(createAdminProcedureContext(db), {});

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 1);
    assert.equal(state.joinCount, 0);
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
      id: "550e8400-e29b-41d4-a716-446655440010",
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
      id: "550e8400-e29b-41d4-a716-446655440010",
      name: "Acme Dataset",
      organizationId: "550e8400-e29b-41d4-a716-446655440000",
      storageKey: "",
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

describe("dataset mutations", () => {
  test("updates and returns the dataset for admins", async () => {
    const input = {
      body: {
        description: "Updated description",
      },
      params: {
        id: "550e8400-e29b-41d4-a716-446655440010",
      },
    };
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      description: input.body.description,
      fileHash: "hash_1",
      fileSize: 123,
      fileType: "csv",
      filename: "acme.csv",
      id: input.params.id,
      name: "Acme Dataset",
      organizationId: "550e8400-e29b-41d4-a716-446655440000",
      storageKey: "datasets/acme.csv",
      updatedAt: null,
      uploadedAt: new Date("2024-01-01T00:00:00.000Z"),
    };
    const { db, state } = createMockUpdateDb(row);

    const result = await updateDataset(createAdminProcedureContext(db), input);

    assert.deepEqual(result, row);
    assert.deepEqual(state.set, input.body);
  });

  test("maps missing datasets on update to not found errors", async () => {
    const { db } = createMockUpdateDb(undefined);

    await assert.rejects(
      () =>
        updateDataset(createAdminProcedureContext(db), {
          body: { description: "Updated description" },
          params: { id: "550e8400-e29b-41d4-a716-446655440010" },
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Dataset not found"
    );
  });

  test("deletes and returns the removed dataset for admins", async () => {
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      description: null,
      fileHash: "hash_1",
      fileSize: 123,
      fileType: "csv",
      filename: "acme.csv",
      id: "550e8400-e29b-41d4-a716-446655440010",
      name: "Acme Dataset",
      organizationId: "550e8400-e29b-41d4-a716-446655440000",
      storageKey: "",
      updatedAt: null,
      uploadedAt: new Date("2024-01-01T00:00:00.000Z"),
    };
    const { db, state } = createMockSequentialSelectDb([[row], [row]]);

    const result = await deleteDataset(createAdminProcedureContext(db), { id: row.id });

    assert.deepEqual(result, row);
    assert.equal(state.limitValues[0], 1);
  });

  test("maps missing datasets on delete to not found errors", async () => {
    const { db } = createMockSequentialSelectDb([[]]);

    await assert.rejects(
      () => deleteDataset(createAdminProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440010" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Dataset not found"
    );
  });
});

describe("listDatasetVariables", () => {
  test("returns dataset variables for dataset members", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        datasetId: "550e8400-e29b-41d4-a716-446655440000",
        id: "550e8400-e29b-41d4-a716-446655440011",
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
        id: "550e8400-e29b-41d4-a716-446655440011",
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

describe("listDatasetAvailableSplitVariables", () => {
  test("returns dataset variables that are not assigned as split variables", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        datasetId: "550e8400-e29b-41d4-a716-446655440000",
        id: "550e8400-e29b-41d4-a716-446655440003",
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

    const result = await listDatasetAvailableSplitVariables(createUserProcedureContext(db), {
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
    assert.equal(state.whereValues.length, 5);
    assert.deepEqual(state.limitValues, [5]);
    assert.deepEqual(state.offsets, [2]);
  });

  test("allows admins to list available split variables without membership", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        datasetId: "550e8400-e29b-41d4-a716-446655440000",
        id: "550e8400-e29b-41d4-a716-446655440003",
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

    const result = await listDatasetAvailableSplitVariables(createAdminProcedureContext(db), {
      id: "550e8400-e29b-41d4-a716-446655440000",
    });

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 1);
    assert.notEqual(state.rowWhere, undefined);
    assert.notEqual(state.countWhere, undefined);
  });

  test("rejects anonymous access to available split variables", async () => {
    const { db } = createMockSequentialSelectDb([]);

    await assert.rejects(
      () =>
        listDatasetAvailableSplitVariables(createAnonymousProcedureContext(db), {
          id: "550e8400-e29b-41d4-a716-446655440000",
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "UNAUTHORIZED" &&
        error.status === 401 &&
        error.message === "Missing user session. Please log in!"
    );
  });

  test("rejects non-member access to available split variables", async () => {
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: false }],
    ]);

    await assert.rejects(
      () =>
        listDatasetAvailableSplitVariables(createUserProcedureContext(db), {
          id: "550e8400-e29b-41d4-a716-446655440000",
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.status === 403 &&
        error.message === "You do not have enough permission to perform this action."
    );
  });
});

describe("listDatasetUnassignedVariables", () => {
  test("returns dataset unassigned variables for dataset members", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        datasetId: "550e8400-e29b-41d4-a716-446655440000",
        id: "550e8400-e29b-41d4-a716-446655440003",
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

    const result = await listDatasetUnassignedVariables(createUserProcedureContext(db), {
      id: "550e8400-e29b-41d4-a716-446655440000",
      limit: "5",
      offset: "2",
      search: "age",
    });

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 1);
    assert.equal(result.limit, 5);
    assert.equal(result.offset, 2);
    assert.deepEqual(result.orderBy, [{ direction: "asc", field: "name" }]);
    assert.equal(state.whereValues.length, 5);
    assert.deepEqual(state.limitValues, [5]);
    assert.deepEqual(state.offsets, [2]);
  });

  test("rejects non-member access to unassigned dataset variables", async () => {
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: false }],
    ]);

    await assert.rejects(
      () =>
        listDatasetUnassignedVariables(createUserProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440000" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.status === 403 &&
        error.message === "You do not have enough permission to perform this action."
    );
  });
});

describe("listDatasetProjects", () => {
  test("returns dataset projects for dataset members", async () => {
    const rows = [
      {
        datasetId: "550e8400-e29b-41d4-a716-446655440000",
        id: "550e8400-e29b-41d4-a716-446655440003",
        project: {
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          id: "550e8400-e29b-41d4-a716-446655440002",
          metadata: null,
          name: "Acme Project",
          organizationId: "550e8400-e29b-41d4-a716-446655440001",
          slug: "acme-project",
          updatedAt: null,
        },
        projectId: "550e8400-e29b-41d4-a716-446655440002",
      },
    ];
    const { db, state } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: true }],
      rows,
      [{ count: 1 }],
    ]);

    const result = await listDatasetProjects(createUserProcedureContext(db), {
      id: "550e8400-e29b-41d4-a716-446655440000",
      limit: "5",
      offset: "2",
      order: "project:name.asc",
      search: "acme",
    });

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 1);
    assert.equal(result.limit, 5);
    assert.equal(result.offset, 2);
    assert.deepEqual(result.orderBy, [{ direction: "asc", field: "name", relationship: "project" }]);
    assert.equal(state.whereValues.length, 4);
    assert.deepEqual(state.limitValues, [5]);
    assert.deepEqual(state.offsets, [2]);
  });

  test("allows admins to list dataset projects without membership", async () => {
    const rows = [
      {
        datasetId: "550e8400-e29b-41d4-a716-446655440000",
        id: "550e8400-e29b-41d4-a716-446655440003",
        project: {
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          id: "550e8400-e29b-41d4-a716-446655440002",
          metadata: null,
          name: "Acme Project",
          organizationId: "550e8400-e29b-41d4-a716-446655440001",
          slug: "acme-project",
          updatedAt: null,
        },
        projectId: "550e8400-e29b-41d4-a716-446655440002",
      },
    ];
    const { db, state } = createMockListDb(rows, 1);

    const result = await listDatasetProjects(createAdminProcedureContext(db), {
      id: "550e8400-e29b-41d4-a716-446655440000",
    });

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 1);
    assert.notEqual(state.rowWhere, undefined);
    assert.notEqual(state.countWhere, undefined);
  });

  test("rejects anonymous access to dataset projects", async () => {
    const { db } = createMockSequentialSelectDb([]);

    await assert.rejects(
      () => listDatasetProjects(createAnonymousProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440000" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "UNAUTHORIZED" &&
        error.status === 401 &&
        error.message === "Missing user session. Please log in!"
    );
  });

  test("rejects non-member access to dataset projects", async () => {
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: false }],
    ]);

    await assert.rejects(
      () => listDatasetProjects(createUserProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440000" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.status === 403 &&
        error.message === "You do not have enough permission to perform this action."
    );
  });
});

describe("listDatasetSplitVariables", () => {
  test("returns dataset split variables for dataset members", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        datasetId: "550e8400-e29b-41d4-a716-446655440000",
        id: "550e8400-e29b-41d4-a716-446655440004",
        variable: {
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          datasetId: "550e8400-e29b-41d4-a716-446655440000",
          id: "550e8400-e29b-41d4-a716-446655440003",
          label: "Age",
          measure: "scale",
          missingRanges: null,
          missingValues: null,
          name: "age",
          type: "int32",
          valueLabels: null,
          variableLabels: null,
        },
        variableId: "550e8400-e29b-41d4-a716-446655440003",
      },
    ];
    const { db, state } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: true }],
      rows,
      [{ count: 1 }],
    ]);

    const result = await listDatasetSplitVariables(createUserProcedureContext(db), {
      id: "550e8400-e29b-41d4-a716-446655440000",
      limit: "5",
      offset: "2",
      order: "variable:name.asc",
      search: "age",
    });

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 1);
    assert.equal(result.limit, 5);
    assert.equal(result.offset, 2);
    assert.deepEqual(result.orderBy, [{ direction: "asc", field: "name", relationship: "variable" }]);
    assert.equal(state.whereValues.length, 4);
    assert.deepEqual(state.limitValues, [5]);
    assert.deepEqual(state.offsets, [2]);
  });

  test("allows admins to list dataset split variables without membership", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        datasetId: "550e8400-e29b-41d4-a716-446655440000",
        id: "550e8400-e29b-41d4-a716-446655440004",
        variable: {
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          datasetId: "550e8400-e29b-41d4-a716-446655440000",
          id: "550e8400-e29b-41d4-a716-446655440003",
          label: "Age",
          measure: "scale",
          missingRanges: null,
          missingValues: null,
          name: "age",
          type: "int32",
          valueLabels: null,
          variableLabels: null,
        },
        variableId: "550e8400-e29b-41d4-a716-446655440003",
      },
    ];
    const { db, state } = createMockListDb(rows, 1);

    const result = await listDatasetSplitVariables(createAdminProcedureContext(db), {
      id: "550e8400-e29b-41d4-a716-446655440000",
    });

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 1);
    assert.notEqual(state.rowWhere, undefined);
    assert.notEqual(state.countWhere, undefined);
  });

  test("rejects anonymous access to dataset split variables", async () => {
    const { db } = createMockSequentialSelectDb([]);

    await assert.rejects(
      () =>
        listDatasetSplitVariables(createAnonymousProcedureContext(db), {
          id: "550e8400-e29b-41d4-a716-446655440000",
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "UNAUTHORIZED" &&
        error.status === 401 &&
        error.message === "Missing user session. Please log in!"
    );
  });

  test("rejects non-member access to dataset split variables", async () => {
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: false }],
    ]);

    await assert.rejects(
      () => listDatasetSplitVariables(createUserProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440000" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.status === 403 &&
        error.message === "You do not have enough permission to perform this action."
    );
  });
});

describe("dataset split variable mutations", () => {
  test("creates a split variable for admins", async () => {
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      datasetId: "550e8400-e29b-41d4-a716-446655440000",
      id: "550e8400-e29b-41d4-a716-446655440004",
      variableId: "550e8400-e29b-41d4-a716-446655440003",
    };
    const { db, state } = createMockInsertDb(row);

    const result = await createDatasetSplitVariable(createAdminProcedureContext(db), {
      id: row.datasetId,
      variableId: row.variableId,
    });

    assert.deepEqual(result, row);
    assert.deepEqual(state.values, {
      datasetId: row.datasetId,
      variableId: row.variableId,
    });
  });

  test("rejects non-admin split variable creation", async () => {
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: true }],
    ]);

    await assert.rejects(
      () =>
        createDatasetSplitVariable(createUserProcedureContext(db), {
          id: "550e8400-e29b-41d4-a716-446655440000",
          variableId: "550e8400-e29b-41d4-a716-446655440003",
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.status === 403 &&
        error.message === "You do not have enough permission to perform this action."
    );
  });

  test("deletes a split variable for admins", async () => {
    const { db } = createMockDeleteDb(undefined);

    const result = await deleteDatasetSplitVariable(createAdminProcedureContext(db), {
      id: "550e8400-e29b-41d4-a716-446655440000",
      variableId: "550e8400-e29b-41d4-a716-446655440003",
    });

    assert.deepEqual(result, { success: true });
  });

  test("rejects non-admin split variable deletion", async () => {
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: true }],
    ]);

    await assert.rejects(
      () =>
        deleteDatasetSplitVariable(createUserProcedureContext(db), {
          id: "550e8400-e29b-41d4-a716-446655440000",
          variableId: "550e8400-e29b-41d4-a716-446655440003",
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.status === 403 &&
        error.message === "You do not have enough permission to perform this action."
    );
  });
});

describe("dataset project mutations", () => {
  test("creates a dataset project for admins", async () => {
    const row = {
      datasetId: "550e8400-e29b-41d4-a716-446655440000",
      id: "550e8400-e29b-41d4-a716-446655440004",
      projectId: "550e8400-e29b-41d4-a716-446655440003",
    };
    const { db, state } = createMockInsertDb(row);

    const result = await createDatasetProject(createAdminProcedureContext(db), {
      datasetId: row.datasetId,
      projectId: row.projectId,
    });

    assert.deepEqual(result, row);
    assert.deepEqual(state.values, {
      datasetId: row.datasetId,
      projectId: row.projectId,
    });
  });

  test("rejects non-admin dataset project creation", async () => {
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: true }],
    ]);

    await assert.rejects(
      () =>
        createDatasetProject(createUserProcedureContext(db), {
          datasetId: "550e8400-e29b-41d4-a716-446655440000",
          projectId: "550e8400-e29b-41d4-a716-446655440003",
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.status === 403 &&
        error.message === "You do not have enough permission to perform this action."
    );
  });
});

describe("listDatasetVariablesets", () => {
  test("returns a flat dataset variableset list for dataset members", async () => {
    const rows = [
      {
        attributes: null,
        category: "general",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        datasetId: "550e8400-e29b-41d4-a716-446655440000",
        description: "Top level set",
        id: "550e8400-e29b-41d4-a716-446655440005",
        name: "Demographics",
        orderIndex: 100,
        parentId: null,
        updatedAt: null,
      },
    ];
    const { db, state } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: true }],
      rows,
      [{ count: 1 }],
    ]);

    const result = await listDatasetVariablesets(createUserProcedureContext(db), {
      id: "550e8400-e29b-41d4-a716-446655440000",
      limit: "5",
      offset: "2",
      search: "demo",
    });
    assert.ok("rows" in result);

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 1);
    assert.equal(result.limit, 5);
    assert.equal(result.offset, 2);
    assert.deepEqual(result.orderBy, [
      { direction: "asc", field: "orderIndex" },
      { direction: "asc", field: "name" },
    ]);
    assert.equal(state.whereValues.length, 4);
    assert.deepEqual(state.limitValues, [5]);
    assert.deepEqual(state.offsets, [2]);
    assert.equal(state.orderByValues[0]?.length, 2);
  });

  test("returns variableset hierarchy for dataset members when requested", async () => {
    const hierarchyRows = [
      {
        attributes: null,
        category: "general",
        description: "Top level set",
        id: "550e8400-e29b-41d4-a716-446655440005",
        name: "Demographics",
        orderIndex: 100,
        parentId: null,
        variableCount: "2",
      },
      {
        attributes: null,
        category: "general",
        description: "Nested set",
        id: "550e8400-e29b-41d4-a716-446655440006",
        name: "Age Group",
        orderIndex: 200,
        parentId: "550e8400-e29b-41d4-a716-446655440005",
        variableCount: "1",
      },
    ];
    const { db, state } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: true }],
      hierarchyRows,
    ]);

    const result = await listDatasetVariablesets(createUserProcedureContext(db), {
      hierarchical: "true",
      id: "550e8400-e29b-41d4-a716-446655440000",
    });

    assert.deepEqual(result, {
      hierarchy: [
        {
          attributes: null,
          category: "general",
          children: [
            {
              attributes: null,
              category: "general",
              children: [],
              description: "Nested set",
              id: "550e8400-e29b-41d4-a716-446655440006",
              level: 1,
              name: "Age Group",
              orderIndex: 200,
              parentId: "550e8400-e29b-41d4-a716-446655440005",
              variableCount: 1,
            },
          ],
          description: "Top level set",
          id: "550e8400-e29b-41d4-a716-446655440005",
          level: 0,
          name: "Demographics",
          orderIndex: 100,
          parentId: null,
          variableCount: 2,
        },
      ],
    });
    assert.equal(state.whereValues.length, 3);
  });

  test("allows admins to list dataset variablesets without membership", async () => {
    const rows = [
      {
        attributes: null,
        category: "general",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        datasetId: "550e8400-e29b-41d4-a716-446655440000",
        description: "Top level set",
        id: "550e8400-e29b-41d4-a716-446655440005",
        name: "Demographics",
        orderIndex: 100,
        parentId: null,
        updatedAt: null,
      },
    ];
    const { db, state } = createMockListDb(rows, 1);

    const result = await listDatasetVariablesets(createAdminProcedureContext(db), {
      id: "550e8400-e29b-41d4-a716-446655440000",
    });
    assert.ok("rows" in result);

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 1);
    assert.notEqual(state.rowWhere, undefined);
    assert.notEqual(state.countWhere, undefined);
  });

  test("rejects anonymous access to dataset variablesets", async () => {
    const { db } = createMockSequentialSelectDb([]);

    await assert.rejects(
      () =>
        listDatasetVariablesets(createAnonymousProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440000" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "UNAUTHORIZED" &&
        error.status === 401 &&
        error.message === "Missing user session. Please log in!"
    );
  });

  test("rejects non-member access to dataset variablesets", async () => {
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: false }],
    ]);

    await assert.rejects(
      () => listDatasetVariablesets(createUserProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440000" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.status === 403 &&
        error.message === "You do not have enough permission to perform this action."
    );
  });
});
