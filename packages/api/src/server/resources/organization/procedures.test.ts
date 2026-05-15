import { ORPCError } from "@orpc/server";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { organization as organizationTable } from "@repo/database/schema";
import {
  createMockDeleteDb,
  createMockInsertDb,
  createMockInsertDbError,
  createMockListDb,
  createMockUpdateDb,
  createMockUpdateDbError,
} from "../../../testing/router";
import { createOrganization, deleteOrganization, listOrganizations, updateOrganization } from "./procedures";

describe("listOrganizations", () => {
  test("inserts and returns the created organization", async () => {
    const createdAt = new Date("2024-01-01T00:00:00.000Z");
    const input = { createdAt, name: "Acme", slug: "acme" };
    const row = { id: "550e8400-e29b-41d4-a716-446655440000", logo: null, metadata: null, ...input, settings: null };
    const { db, state } = createMockInsertDb(row);

    const result = await createOrganization({ db }, input);

    assert.deepEqual(result, row);
    assert.equal(state.table, organizationTable);
    assert.deepEqual(state.values, input);
  });

  test("maps duplicate slugs to oRPC conflict errors", async () => {
    const createdAt = new Date("2024-01-01T00:00:00.000Z");
    const input = { createdAt, name: "Acme", slug: "acme" };
    const duplicateSlugError = Object.assign(new Error("Failed query"), {
      cause: {
        code: "23505",
        constraint: "organizations_slug_unique",
        detail: "Key (slug)=(acme) already exists.",
        schema: "public",
        table: "organizations",
      },
    });
    const { db, state } = createMockInsertDbError(duplicateSlugError);

    await assert.rejects(
      () => createOrganization({ db }, input),
      (error: unknown) => {
        if (!(error instanceof ORPCError)) {
          return false;
        }

        assert.equal(error.code, "UNIQUE_VIOLATION");
        assert.equal(error.message, "Organization slug already exists");
        assert.equal(error.status, 409);
        assert.deepEqual(error.data, {
          fields: ["slug"],
          reason: "already_exists",
        });
        return true;
      }
    );

    assert.equal(state.table, organizationTable);
    assert.deepEqual(state.values, input);
  });

  test("updates and returns the organization for partial inputs", async () => {
    const input = {
      body: {
        name: "Acme Updated",
      },
      params: {
        id: "550e8400-e29b-41d4-a716-446655440000",
      },
    };
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      id: input.params.id,
      logo: null,
      metadata: null,
      name: input.body.name,
      settings: null,
      slug: "acme",
    };
    const { db, state } = createMockUpdateDb(row);

    const result = await updateOrganization({ db }, input);

    assert.deepEqual(result, row);
    assert.equal(state.table, organizationTable);
    assert.deepEqual(state.set, input.body);
    assert.notEqual(state.where, undefined);
  });

  test("maps duplicate slugs on update to oRPC conflict errors", async () => {
    const input = {
      body: {
        slug: "acme",
      },
      params: {
        id: "550e8400-e29b-41d4-a716-446655440000",
      },
    };
    const duplicateSlugError = Object.assign(new Error("Failed query"), {
      cause: {
        code: "23505",
        constraint: "organizations_slug_unique",
        detail: "Key (slug)=(acme) already exists.",
        schema: "public",
        table: "organizations",
      },
    });
    const { db, state } = createMockUpdateDbError(duplicateSlugError);

    await assert.rejects(
      () => updateOrganization({ db }, input),
      (error: unknown) => {
        if (!(error instanceof ORPCError)) {
          return false;
        }

        assert.equal(error.code, "UNIQUE_VIOLATION");
        assert.equal(error.message, "Organization slug already exists");
        assert.equal(error.status, 409);
        assert.deepEqual(error.data, {
          fields: ["slug"],
          reason: "already_exists",
        });
        return true;
      }
    );

    assert.equal(state.table, organizationTable);
    assert.deepEqual(state.set, input.body);
    assert.notEqual(state.where, undefined);
  });

  test("deletes and returns the removed organization", async () => {
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      id: "550e8400-e29b-41d4-a716-446655440000",
      logo: null,
      metadata: null,
      name: "Acme",
      settings: null,
      slug: "acme",
    };
    const { db, state } = createMockDeleteDb(row);

    const result = await deleteOrganization({ db }, { id: row.id });

    assert.deepEqual(result, row);
    assert.equal(state.table, organizationTable);
    assert.notEqual(state.where, undefined);
  });

  test("maps missing organization deletes to not found errors", async () => {
    const { db } = createMockDeleteDb(undefined);

    await assert.rejects(
      () => deleteOrganization({ db }, { id: "550e8400-e29b-41d4-a716-446655440000" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Organization not found"
    );
  });

  test("maps missing organization updates to not found errors", async () => {
    const { db } = createMockUpdateDb(undefined);

    await assert.rejects(
      () =>
        updateOrganization(
          { db },
          { body: { name: "Acme Updated" }, params: { id: "550e8400-e29b-41d4-a716-446655440000" } }
        ),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Organization not found"
    );
  });

  test("returns paginated rows with validated scalar filters", async () => {
    const rows = [{ id: "org_1", name: "Acme", slug: "acme" }];
    const { db, state } = createMockListDb(rows, 42);

    const result = await listOrganizations(
      { db },
      { limit: "5", name: "ilike.*acme*", order: "name.asc", offset: "2" }
    );

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 42);
    assert.equal(result.limit, 5);
    assert.equal(result.offset, 2);
    assert.deepEqual(result.orderBy, [{ field: "name", direction: "asc" }]);
    assert.equal(state.orderBy.length, 1);
    assert.notEqual(state.rowWhere, undefined);
    assert.notEqual(state.countWhere, undefined);
    assert.equal(state.offset, 2);
  });

  test("searches across configured organization fields", async () => {
    const rows = [{ id: "org_1", name: "Acme", slug: "acme" }];
    const { db, state } = createMockListDb(rows, 1);

    const result = await listOrganizations({ db }, { search: "acme" });

    assert.deepEqual(result.rows, rows);
    assert.notEqual(state.rowWhere, undefined);
    assert.notEqual(state.countWhere, undefined);
  });

  test("maps scalar validation failures to oRPC input errors", async () => {
    const { db } = createMockListDb([], 0);

    await assert.rejects(
      () => listOrganizations({ db }, { settings: "eq.theme" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "INPUT_VALIDATION_FAILED" &&
        error.status === 422 &&
        error.message.includes("Field 'settings' does not support filtering")
    );
  });
});
