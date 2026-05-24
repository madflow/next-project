import { ORPCError } from "@orpc/server";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  createAdminProcedureContext,
  createAnonymousProcedureContext,
  createUserProcedureContext,
} from "../../../testing/auth";
import { createMockListDb } from "../../../testing/router";
import { listDatasets } from "./procedures";

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
