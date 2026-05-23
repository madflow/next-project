import { ORPCError } from "@orpc/server";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { organization as organizationTable } from "@repo/database/schema";
import {
  createAdminAPIKeyProcedureContext,
  createAdminProcedureContext,
  createAnonymousProcedureContext,
  createUserProcedureContext,
} from "../../../testing/auth";
import {
  createMockDeleteDb,
  createMockDeleteDbError,
  createMockInsertDb,
  createMockInsertDbError,
  createMockListDb,
  createMockSequentialSelectDb,
  createMockUpdateDb,
  createMockUpdateDbError,
} from "../../../testing/router";
import {
  createOrganization,
  deleteOrganization,
  getOrganization,
  listOrganizationProjects,
  listOrganizations,
  updateOrganization,
} from "./procedures";

describe("listOrganizations", () => {
  test("inserts and returns the created organization", async () => {
    const createdAt = new Date("2024-01-01T00:00:00.000Z");
    const input = { createdAt, name: "Acme", slug: "acme" };
    const row = { id: "550e8400-e29b-41d4-a716-446655440000", logo: null, metadata: null, ...input, settings: null };
    const { db, state } = createMockInsertDb(row);

    const result = await createOrganization(createAdminProcedureContext(db), input);

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
      () => createOrganization(createAdminProcedureContext(db), input),
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

    const result = await updateOrganization(createAdminProcedureContext(db), input);

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
      () => updateOrganization(createAdminProcedureContext(db), input),
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

    const result = await deleteOrganization(createAdminProcedureContext(db), { id: row.id });

    assert.deepEqual(result, row);
    assert.equal(state.table, organizationTable);
    assert.notEqual(state.where, undefined);
  });

  test("maps missing organization deletes to not found errors", async () => {
    const { db } = createMockDeleteDb(undefined);

    await assert.rejects(
      () => deleteOrganization(createAdminProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440000" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Organization not found"
    );
  });

  test("maps delete constraint errors to oRPC conflict errors", async () => {
    const referencedOrganizationError = Object.assign(new Error("Failed query"), {
      cause: {
        code: "23503",
        constraint: "projects_organization_id_organizations_id_fk",
        detail: 'Key (id)=(550e8400-e29b-41d4-a716-446655440000) is still referenced from table "projects".',
        schema: "public",
        table: "organizations",
      },
    });
    const { db } = createMockDeleteDbError(referencedOrganizationError);

    await assert.rejects(
      () => deleteOrganization(createAdminProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440000" }),
      (error: unknown) => {
        if (!(error instanceof ORPCError)) {
          return false;
        }

        assert.equal(error.code, "FOREIGN_KEY_VIOLATION");
        assert.equal(error.message, "Record is still referenced by other data");
        assert.equal(error.status, 409);
        assert.deepEqual(error.data, {
          fields: ["id"],
          reason: "restricted",
        });
        return true;
      }
    );
  });

  test("maps missing organization updates to not found errors", async () => {
    const { db } = createMockUpdateDb(undefined);

    await assert.rejects(
      () =>
        updateOrganization(createAdminProcedureContext(db), {
          body: { name: "Acme Updated" },
          params: { id: "550e8400-e29b-41d4-a716-446655440000" },
        }),
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

    const result = await listOrganizations(createAdminProcedureContext(db), {
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
  });

  test("searches across configured organization fields", async () => {
    const rows = [{ id: "org_1", name: "Acme", slug: "acme" }];
    const { db, state } = createMockListDb(rows, 1);

    const result = await listOrganizations(createAdminProcedureContext(db), { search: "acme" });

    assert.deepEqual(result.rows, rows);
    assert.notEqual(state.rowWhere, undefined);
    assert.notEqual(state.countWhere, undefined);
  });

  test("maps scalar validation failures to oRPC input errors", async () => {
    const { db } = createMockListDb([], 0);

    await assert.rejects(
      () => listOrganizations(createAdminProcedureContext(db), { settings: "eq.theme" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "INPUT_VALIDATION_FAILED" &&
        error.status === 422 &&
        error.message.includes("Field 'settings' does not support filtering")
    );
  });

  test("rejects anonymous access to organization listing", async () => {
    const { db } = createMockListDb([], 0);

    await assert.rejects(
      () => listOrganizations(createAnonymousProcedureContext(db), {}),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "UNAUTHORIZED" &&
        error.status === 401 &&
        error.message === "Missing user session. Please log in!"
    );
  });

  test("rejects non-admin access to organization listing", async () => {
    const { db } = createMockListDb([], 0);

    await assert.rejects(
      () => listOrganizations(createUserProcedureContext(db), {}),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.status === 403 &&
        error.message === "You do not have enough permission to perform this action."
    );
  });

  test("allows admin API keys to access organization listing", async () => {
    const rows = [{ id: "org_1", name: "Acme", slug: "acme" }];
    const { db } = createMockListDb(rows, 1);

    const result = await listOrganizations(createAdminAPIKeyProcedureContext(db), {});

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 1);
  });

  test("returns an organization by id for organization members", async () => {
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      id: "550e8400-e29b-41d4-a716-446655440000",
      logo: null,
      metadata: null,
      name: "Acme",
      settings: null,
      slug: "acme",
    };
    const { db, state } = createMockSequentialSelectDb([[row], [{ id: "membership_1" }]]);

    const result = await getOrganization(createUserProcedureContext(db), { id: row.id });

    assert.deepEqual(result, row);
    assert.equal(state.whereValues.length, 2);
    assert.deepEqual(state.limitValues, [1, 1]);
  });

  test("returns organization projects for organization members", async () => {
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
    const { db, state } = createMockSequentialSelectDb([[{ id: "membership_1" }], rows, [{ count: 1 }]]);

    const result = await listOrganizationProjects(createUserProcedureContext(db), {
      id: "550e8400-e29b-41d4-a716-446655440000",
      limit: "5",
      order: "name.asc",
      offset: "2",
      search: "acme",
    });

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 1);
    assert.equal(result.limit, 5);
    assert.equal(result.offset, 2);
    assert.deepEqual(result.orderBy, [{ direction: "asc", field: "name" }]);
    assert.equal(state.whereValues.length, 3);
    assert.deepEqual(state.limitValues, [1, 5]);
    assert.deepEqual(state.offsets, [2]);
  });

  test("allows admins to list organization projects without membership", async () => {
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

    const result = await listOrganizationProjects(createAdminProcedureContext(db), {
      id: "550e8400-e29b-41d4-a716-446655440000",
    });

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 1);
    assert.notEqual(state.rowWhere, undefined);
    assert.notEqual(state.countWhere, undefined);
  });

  test("returns not found when the organization does not exist", async () => {
    const { db } = createMockSequentialSelectDb([[]]);

    await assert.rejects(
      () => getOrganization(createAdminProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440000" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Organization not found"
    );
  });

  test("rejects non-member access to an organization", async () => {
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      id: "550e8400-e29b-41d4-a716-446655440000",
      logo: null,
      metadata: null,
      name: "Acme",
      settings: null,
      slug: "acme",
    };
    const { db } = createMockSequentialSelectDb([[row], []]);

    await assert.rejects(
      () => getOrganization(createUserProcedureContext(db), { id: row.id }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.status === 403 &&
        error.message === "You do not have enough permission to perform this action."
    );
  });

  test("rejects anonymous access to organization projects", async () => {
    const { db } = createMockSequentialSelectDb([]);

    await assert.rejects(
      () =>
        listOrganizationProjects(createAnonymousProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440000" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "UNAUTHORIZED" &&
        error.status === 401 &&
        error.message === "Missing user session. Please log in!"
    );
  });

  test("rejects non-member access to organization projects", async () => {
    const { db } = createMockSequentialSelectDb([[]]);

    await assert.rejects(
      () => listOrganizationProjects(createUserProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440000" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.status === 403 &&
        error.message === "You do not have enough permission to perform this action."
    );
  });
});
