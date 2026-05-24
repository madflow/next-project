import { ORPCError } from "@orpc/server";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { project as projectTable } from "@repo/database/schema";
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
  createProject,
  deleteProject,
  getProject,
  listProjectDatasets,
  listProjects,
  updateProject,
} from "./procedures";

describe("listProjects", () => {
  test("inserts and returns the created project", async () => {
    const createdAt = new Date("2024-01-01T00:00:00.000Z");
    const input = {
      createdAt,
      name: "Acme Project",
      organizationId: "550e8400-e29b-41d4-a716-446655440000",
      slug: "acme-project",
    };
    const row = { id: "550e8400-e29b-41d4-a716-446655440001", metadata: null, ...input, updatedAt: null };
    const { db, state } = createMockInsertDb(row);

    const result = await createProject(createAdminProcedureContext(db), input);

    assert.deepEqual(result, row);
    assert.equal(state.table, projectTable);
    assert.deepEqual(state.values, input);
  });

  test("deletes and returns the removed project", async () => {
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      id: "550e8400-e29b-41d4-a716-446655440001",
      metadata: null,
      name: "Acme Project",
      organizationId: "550e8400-e29b-41d4-a716-446655440000",
      slug: "acme-project",
      updatedAt: null,
    };
    const { db, state } = createMockDeleteDb(row);

    const result = await deleteProject(createAdminProcedureContext(db), { id: row.id });

    assert.deepEqual(result, row);
    assert.equal(state.table, projectTable);
    assert.notEqual(state.where, undefined);
  });

  test("updates and returns the project for partial inputs", async () => {
    const input = {
      body: {
        name: "Acme Project Updated",
      },
      params: {
        id: "550e8400-e29b-41d4-a716-446655440001",
      },
    };
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      id: input.params.id,
      metadata: null,
      name: input.body.name,
      organizationId: "550e8400-e29b-41d4-a716-446655440000",
      slug: "acme-project",
      updatedAt: null,
    };
    const { db, state } = createMockUpdateDb(row);

    const result = await updateProject(createAdminProcedureContext(db), input);

    assert.deepEqual(result, row);
    assert.equal(state.table, projectTable);
    assert.deepEqual(state.set, input.body);
    assert.notEqual(state.where, undefined);
  });

  test("maps missing project updates to not found errors", async () => {
    const { db } = createMockUpdateDb(undefined);

    await assert.rejects(
      () =>
        updateProject(createAdminProcedureContext(db), {
          body: { name: "Acme Project Updated" },
          params: { id: "550e8400-e29b-41d4-a716-446655440001" },
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Project not found"
    );
  });

  test("returns paginated rows with validated scalar filters", async () => {
    const rows = [
      {
        id: "project_1",
        name: "Acme Project",
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        slug: "acme-project",
      },
    ];
    const { db, state } = createMockListDb(rows, 42);

    const result = await listProjects(createAdminProcedureContext(db), {
      limit: "5",
      name: "ilike.*acme*",
      order: "name.asc",
      offset: "2",
    });

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 42);
    assert.equal(result.limit, 5);
    assert.equal(result.offset, 2);
    assert.deepEqual(result.orderBy, [{ field: "name", direction: "asc" }]);
    assert.equal(state.orderBy.length, 1);
    assert.notEqual(state.rowWhere, undefined);
    assert.notEqual(state.countWhere, undefined);
    assert.equal(state.offset, 2);
    assert.equal(state.joinCount, 0);
  });

  test("searches across configured project fields without joins", async () => {
    const rows = [
      {
        id: "project_1",
        name: "Acme Project",
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        slug: "acme-project",
      },
    ];
    const { db, state } = createMockListDb(rows, 1);

    const result = await listProjects(createAdminProcedureContext(db), { search: "acme" });

    assert.deepEqual(result.rows, rows);
    assert.equal(state.joinCount, 0);
    assert.notEqual(state.rowWhere, undefined);
  });

  test("embeds organization when requested", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        id: "project_1",
        metadata: null,
        name: "Acme Project",
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
        slug: "acme-project",
        updatedAt: null,
      },
    ];
    const { db, state } = createMockListDb(rows, 1);

    const result = await listProjects(createAdminProcedureContext(db), {
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
        id: "project_1",
        metadata: null,
        name: "Acme Project",
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        slug: "acme-project",
        updatedAt: null,
      },
    ];
    const { db, state } = createMockListDb(rows, 1);

    const result = await listProjects(createAdminProcedureContext(db), { "organization:name": "eq.Acme Org" });

    assert.deepEqual(result.rows, rows);
    assert.equal(state.joinCount, 2);
  });

  test("maps scalar validation failures to oRPC input errors", async () => {
    const { db } = createMockListDb([], 0);

    await assert.rejects(
      () => listProjects(createAdminProcedureContext(db), { metadata: "eq.theme" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "INPUT_VALIDATION_FAILED" &&
        error.status === 422 &&
        error.message.includes("Field 'metadata' does not support filtering")
    );
  });

  test("maps unknown embeds to oRPC input errors", async () => {
    const { db } = createMockListDb([], 0);

    await assert.rejects(
      () => listProjects(createAdminProcedureContext(db), { embed: "owner" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "INPUT_VALIDATION_FAILED" &&
        error.status === 422 &&
        error.message.includes("Unknown embed 'owner'")
    );
  });

  test("returns a project with embedded organization when requested", async () => {
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      id: "project_1",
      metadata: null,
      name: "Acme Project",
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
      slug: "acme-project",
      updatedAt: null,
    };
    const { db, state } = createMockSequentialSelectDb([[row], [{ exists: true }]]);

    const result = await getProject(createUserProcedureContext(db), {
      embed: "organization",
      id: row.id,
    });

    assert.deepEqual(result, row);
    assert.equal(state.whereValues.length, 2);
    assert.deepEqual(state.limitValues, [1]);
  });

  test("returns not found when the project does not exist", async () => {
    const { db } = createMockSequentialSelectDb([[]]);

    await assert.rejects(
      () => getProject(createAdminProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440001" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Project not found"
    );
  });

  test("rejects anonymous access to a project", async () => {
    const { db } = createMockSequentialSelectDb([]);

    await assert.rejects(
      () => getProject(createAnonymousProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440001" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "UNAUTHORIZED" &&
        error.status === 401 &&
        error.message === "Missing user session. Please log in!"
    );
  });

  test("rejects non-member access to a project", async () => {
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      id: "project_1",
      metadata: null,
      name: "Acme Project",
      organizationId: "550e8400-e29b-41d4-a716-446655440000",
      slug: "acme-project",
      updatedAt: null,
    };
    const { db } = createMockSequentialSelectDb([[row], [{ exists: false }]]);

    await assert.rejects(
      () => getProject(createUserProcedureContext(db), { id: row.id }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.status === 403 &&
        error.message === "You do not have enough permission to perform this action."
    );
  });
});

describe("listProjectDatasets", () => {
  test("returns linked dataset rows for project members", async () => {
    const projectId = "550e8400-e29b-41d4-a716-446655440001";
    const organizationId = "550e8400-e29b-41d4-a716-446655440000";
    const rows = [
      {
        dataset: {
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          description: null,
          fileHash: "hash_1",
          filename: "acme.csv",
          fileSize: 123,
          fileType: "csv",
          id: "550e8400-e29b-41d4-a716-446655440010",
          name: "Acme Dataset",
          organizationId,
          storageKey: "datasets/acme.csv",
          updatedAt: null,
          uploadedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        datasetId: "550e8400-e29b-41d4-a716-446655440010",
        id: "550e8400-e29b-41d4-a716-446655440011",
        project: {
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          id: projectId,
          metadata: null,
          name: "Acme Project",
          organizationId,
          slug: "acme-project",
          updatedAt: null,
        },
        projectId,
      },
    ];
    const { db, state } = createMockSequentialSelectDb([
      [
        {
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          id: projectId,
          metadata: null,
          name: "Acme Project",
          organizationId,
          slug: "acme-project",
          updatedAt: null,
        },
      ],
      [{ exists: true }],
      rows,
      [{ count: 1 }],
    ]);

    const result = await listProjectDatasets(createUserProcedureContext(db), {
      embed: "dataset,project",
      id: projectId,
      limit: "5",
      offset: "2",
      order: "dataset:name.asc",
      search: "acme",
    });

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 1);
    assert.equal(result.limit, 5);
    assert.equal(result.offset, 2);
    assert.deepEqual(result.orderBy, [{ direction: "asc", field: "name", relationship: "dataset" }]);
    assert.equal(state.whereValues.length, 4);
    assert.deepEqual(state.limitValues, [1, 5]);
    assert.deepEqual(state.offsets, [2]);
  });

  test("rejects non-member access to project datasets", async () => {
    const projectId = "550e8400-e29b-41d4-a716-446655440001";
    const { db } = createMockSequentialSelectDb([
      [
        {
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          id: projectId,
          metadata: null,
          name: "Acme Project",
          organizationId: "550e8400-e29b-41d4-a716-446655440000",
          slug: "acme-project",
          updatedAt: null,
        },
      ],
      [{ exists: false }],
    ]);

    await assert.rejects(
      () => listProjectDatasets(createUserProcedureContext(db), { id: projectId }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.status === 403 &&
        error.message === "You do not have enough permission to perform this action."
    );
  });
});
