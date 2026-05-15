import { ORPCError } from "@orpc/server";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { project as projectTable } from "@repo/database/schema";
import { createMockDeleteDb, createMockInsertDb, createMockListDb, createMockUpdateDb } from "../../../testing/router";
import { createProject, deleteProject, listProjects, updateProject } from "./procedures";

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

    const result = await createProject({ db }, input);

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

    const result = await deleteProject({ db }, { id: row.id });

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

    const result = await updateProject({ db }, input);

    assert.deepEqual(result, row);
    assert.equal(state.table, projectTable);
    assert.deepEqual(state.set, input.body);
    assert.notEqual(state.where, undefined);
  });

  test("maps missing project updates to not found errors", async () => {
    const { db } = createMockUpdateDb(undefined);

    await assert.rejects(
      () =>
        updateProject(
          { db },
          { body: { name: "Acme Project Updated" }, params: { id: "550e8400-e29b-41d4-a716-446655440001" } }
        ),
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

    const result = await listProjects({ db }, { limit: "5", name: "ilike.*acme*", order: "name.asc", offset: "2" });

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

    const result = await listProjects({ db }, { search: "acme" });

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

    const result = await listProjects({ db }, { embed: "organization", order: "organization:name.asc" });

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

    const result = await listProjects({ db }, { "organization:name": "eq.Acme Org" });

    assert.deepEqual(result.rows, rows);
    assert.equal(state.joinCount, 2);
  });

  test("maps scalar validation failures to oRPC input errors", async () => {
    const { db } = createMockListDb([], 0);

    await assert.rejects(
      () => listProjects({ db }, { metadata: "eq.theme" }),
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
      () => listProjects({ db }, { embed: "owner" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "INPUT_VALIDATION_FAILED" &&
        error.status === 422 &&
        error.message.includes("Unknown embed 'owner'")
    );
  });
});
