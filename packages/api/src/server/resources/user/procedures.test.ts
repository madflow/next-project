import { ORPCError } from "@orpc/server";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { user as userTable } from "@repo/database/schema";
import {
  createAdminProcedureContext,
  createAnonymousProcedureContext,
  createUserProcedureContext,
} from "../../../testing/auth";
import { createMockDeleteDb, createMockInsertDb, createMockListDb, createMockUpdateDb } from "../../../testing/router";
import { createUser, deleteUser, listUsers, updateUser } from "./procedures";

describe("users", () => {
  test("inserts and returns the created user", async () => {
    const input = {
      banExpires: null,
      banReason: null,
      banned: false,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      email: "new@example.com",
      emailVerified: false,
      image: null,
      locale: "en",
      name: "New User",
      role: "user",
      updatedAt: new Date("2024-01-02T00:00:00.000Z"),
    };
    const row = {
      id: "550e8400-e29b-41d4-a716-446655440099",
      ...input,
    };
    const { db, state } = createMockInsertDb(row);

    const result = await createUser(createAdminProcedureContext(db), input);

    assert.deepEqual(result, row);
    assert.equal(state.table, userTable);
    assert.deepEqual(state.values, input);
  });

  test("updates and returns the user for partial inputs", async () => {
    const input = {
      body: {
        locale: "de",
        role: "admin",
      },
      params: {
        id: "550e8400-e29b-41d4-a716-446655440010",
      },
    };
    const row = {
      banExpires: null,
      banReason: null,
      banned: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      email: "user@example.com",
      emailVerified: true,
      id: input.params.id,
      image: null,
      locale: input.body.locale,
      name: "Regular User",
      role: input.body.role,
      updatedAt: new Date("2024-01-02T00:00:00.000Z"),
    };
    const { db, state } = createMockUpdateDb(row);

    const result = await updateUser(createAdminProcedureContext(db), input);

    assert.deepEqual(result, row);
    assert.equal(state.table, userTable);
    assert.deepEqual(state.set, input.body);
    assert.notEqual(state.where, undefined);
  });

  test("maps missing users on update to not found errors", async () => {
    const { db } = createMockUpdateDb(undefined);

    await assert.rejects(
      () =>
        updateUser(createAdminProcedureContext(db), {
          body: { role: "admin" },
          params: { id: "550e8400-e29b-41d4-a716-446655440010" },
        }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "NOT_FOUND" &&
        error.status === 404 &&
        error.message === "User not found"
    );
  });

  test("deletes and returns the removed user", async () => {
    const row = {
      banExpires: null,
      banReason: null,
      banned: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      email: "user@example.com",
      emailVerified: true,
      id: "550e8400-e29b-41d4-a716-446655440010",
      image: null,
      locale: "en",
      name: "Regular User",
      role: "user",
      updatedAt: new Date("2024-01-02T00:00:00.000Z"),
    };
    const { db, state } = createMockDeleteDb(row);

    const result = await deleteUser(createAdminProcedureContext(db), { id: row.id });

    assert.deepEqual(result, row);
    assert.equal(state.table, userTable);
    assert.notEqual(state.where, undefined);
  });

  test("maps missing users on delete to not found errors", async () => {
    const { db } = createMockDeleteDb(undefined);

    await assert.rejects(
      () => deleteUser(createAdminProcedureContext(db), { id: "550e8400-e29b-41d4-a716-446655440010" }),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "NOT_FOUND" &&
        error.status === 404 &&
        error.message === "User not found"
    );
  });

  test("returns paginated rows with validated filters", async () => {
    const rows = [
      {
        banExpires: null,
        banReason: null,
        banned: false,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        email: "user@example.com",
        emailVerified: true,
        id: "550e8400-e29b-41d4-a716-446655440010",
        image: null,
        locale: "en",
        name: "Regular User",
        role: "user",
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      },
    ];
    const { db, state } = createMockListDb(rows, 42);

    const result = await listUsers(createAdminProcedureContext(db), {
      email: "eq.user@example.com",
      limit: "5",
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

  test("parses search across name and email", async () => {
    const rows = [
      {
        banExpires: null,
        banReason: null,
        banned: false,
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
    ];
    const { db, state } = createMockListDb(rows, 1);

    const result = await listUsers(createAdminProcedureContext(db), { search: "admin" });

    assert.deepEqual(result.rows, rows);
    assert.notEqual(state.rowWhere, undefined);
  });

  test("rejects unknown user filters as input errors", async () => {
    const { db } = createMockListDb([], 0);

    await assert.rejects(
      () => listUsers(createAdminProcedureContext(db), { settings: "eq.theme" }),
      (error: unknown) => error instanceof ORPCError && error.code === "INPUT_VALIDATION_FAILED"
    );
  });

  test("rejects anonymous access", async () => {
    const { db } = createMockListDb([], 0);

    await assert.rejects(
      () => listUsers(createAnonymousProcedureContext(db), {}),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "UNAUTHORIZED" &&
        error.message === "Missing user session. Please log in!"
    );
  });

  test("rejects authenticated non-admin access", async () => {
    const { db } = createMockListDb([], 0);

    await assert.rejects(
      () => listUsers(createUserProcedureContext(db), {}),
      (error: unknown) =>
        error instanceof ORPCError &&
        error.code === "FORBIDDEN" &&
        error.message === "You do not have enough permission to perform this action."
    );
  });
});
