import { ORPCError } from "@orpc/server";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { member as memberTable } from "@repo/database/schema";
import { createAdminProcedureContext } from "../../../testing/auth";
import { createMockDeleteDb, createMockInsertDb, createMockListDb, createMockUpdateDb } from "../../../testing/router";
import { createMember, deleteMember, listMembers, updateMember } from "./procedures";

describe("listMembers", () => {
  test("inserts and returns the created member", async () => {
    const createdAt = new Date("2024-01-01T00:00:00.000Z");
    const input = {
      createdAt,
      organizationId: "550e8400-e29b-41d4-a716-446655440000",
      role: "member",
      userId: "550e8400-e29b-41d4-a716-446655440001",
    };
    const row = { id: "550e8400-e29b-41d4-a716-446655440002", ...input };
    const { db, state } = createMockInsertDb(row);

    const result = await createMember(createAdminProcedureContext(db), input);

    assert.deepEqual(result, row);
    assert.equal(state.table, memberTable);
    assert.deepEqual(state.values, input);
  });

  test("deletes and returns the removed member", async () => {
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      id: "550e8400-e29b-41d4-a716-446655440002",
      organizationId: "550e8400-e29b-41d4-a716-446655440000",
      role: "member",
      userId: "550e8400-e29b-41d4-a716-446655440001",
    };
    const { db, state } = createMockDeleteDb(row);

    const result = await deleteMember(createAdminProcedureContext(db), { id: row.id });

    assert.deepEqual(result, row);
    assert.equal(state.table, memberTable);
    assert.notEqual(state.where, undefined);
  });

  test("updates and returns the member for partial inputs", async () => {
    const input = {
      body: {
        role: "admin",
      },
      params: {
        id: "550e8400-e29b-41d4-a716-446655440002",
      },
    };
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      id: input.params.id,
      organizationId: "550e8400-e29b-41d4-a716-446655440000",
      role: input.body.role,
      userId: "550e8400-e29b-41d4-a716-446655440001",
    };
    const { db, state } = createMockUpdateDb(row);

    const result = await updateMember(createAdminProcedureContext(db), input);

    assert.deepEqual(result, row);
    assert.equal(state.table, memberTable);
    assert.deepEqual(state.set, input.body);
    assert.notEqual(state.where, undefined);
  });

  test("maps missing member updates to not found errors", async () => {
    const { db } = createMockUpdateDb(undefined);

    await assert.rejects(
      () =>
        updateMember(createAdminProcedureContext(db), {
          body: { role: "admin" },
          params: { id: "550e8400-e29b-41d4-a716-446655440002" },
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Member not found"
    );
  });

  test("returns paginated rows with validated scalar filters", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        id: "member_1",
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        role: "admin",
        userId: "550e8400-e29b-41d4-a716-446655440001",
      },
    ];
    const { db, state } = createMockListDb(rows, 42);

    const result = await listMembers(createAdminProcedureContext(db), {
      limit: "5",
      order: "role.asc",
      organizationId: "eq.550e8400-e29b-41d4-a716-446655440000",
      offset: "2",
    });

    assert.deepEqual(result.rows, rows);
    assert.equal(result.count, 42);
    assert.equal(result.limit, 5);
    assert.equal(result.offset, 2);
    assert.deepEqual(result.orderBy, [{ field: "role", direction: "asc" }]);
    assert.equal(state.orderBy.length, 1);
    assert.notEqual(state.rowWhere, undefined);
    assert.notEqual(state.countWhere, undefined);
    assert.equal(state.offset, 2);
    assert.equal(state.joinCount, 0);
  });

  test("embeds organization and user when requested", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        id: "member_1",
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
        role: "admin",
        user: {
          banExpires: null,
          banReason: null,
          banned: null,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          email: "admin@example.com",
          emailVerified: true,
          id: "550e8400-e29b-41d4-a716-446655440001",
          image: null,
          locale: "en",
          name: "Admin User",
          role: "admin",
          updatedAt: new Date("2024-01-02T00:00:00.000Z"),
        },
        userId: "550e8400-e29b-41d4-a716-446655440001",
      },
    ];
    const { db, state } = createMockListDb(rows, 1);

    const result = await listMembers(createAdminProcedureContext(db), {
      embed: "organization,user",
      order: "organization:name.asc,user:name.desc",
    });

    assert.deepEqual(result.rows, rows);
    assert.deepEqual(result.orderBy, [
      { direction: "asc", field: "name", relationship: "organization" },
      { direction: "desc", field: "name", relationship: "user" },
    ]);
    assert.equal(state.joinCount, 4);
    assert.notEqual(state.rowSelection, undefined);
  });

  test("joins user for relationship filters without embedding it", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        id: "member_1",
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        role: "admin",
        userId: "550e8400-e29b-41d4-a716-446655440001",
      },
    ];
    const { db, state } = createMockListDb(rows, 1);

    const result = await listMembers(createAdminProcedureContext(db), { "user:email": "eq.admin@example.com" });

    assert.deepEqual(result.rows, rows);
    assert.equal(state.joinCount, 2);
  });

  test("joins user for member search without embedding it", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        id: "member_1",
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        role: "admin",
        userId: "550e8400-e29b-41d4-a716-446655440001",
      },
    ];
    const { db, state } = createMockListDb(rows, 1);

    const result = await listMembers(createAdminProcedureContext(db), { search: "admin" });

    assert.deepEqual(result.rows, rows);
    assert.equal(state.joinCount, 2);
    assert.notEqual(state.rowWhere, undefined);
  });

  test("maps unknown embeds to oRPC input errors", async () => {
    const { db } = createMockListDb([], 0);

    await assert.rejects(
      () => listMembers(createAdminProcedureContext(db), { embed: "owner" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "INPUT_VALIDATION_FAILED" &&
        error.status === 422 &&
        error.message.includes("Unknown embed 'owner'")
    );
  });
});
