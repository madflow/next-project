import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createAnonymousProcedureContext, createUserProcedureContext } from "../../../testing/auth";
import { createMockLookupUserDb, createMockSequentialSelectDb } from "../../../testing/router";
import { getCurrentUser, listCurrentUserOrganizations } from "./procedures";

describe("getCurrentUser", () => {
  test("returns the current user for authenticated requests", async () => {
    const row = {
      email: "user@example.com",
      emailVerified: true,
      id: "550e8400-e29b-41d4-a716-446655440010",
      image: null,
      locale: "en",
      name: "Regular User",
      role: "user",
    };
    const { db, state } = createMockLookupUserDb(row);

    const result = await getCurrentUser(createUserProcedureContext(db));

    assert.deepEqual(result, row);
    assert.notEqual(state.selection, undefined);
    assert.notEqual(state.where, undefined);
  });

  test("returns null for anonymous requests", async () => {
    const { db, state } = createMockLookupUserDb(undefined);

    const result = await getCurrentUser(createAnonymousProcedureContext(db));

    assert.equal(result, null);
    assert.equal(state.selection, undefined);
    assert.equal(state.where, undefined);
  });

  test("returns null when the current user no longer exists", async () => {
    const { db } = createMockLookupUserDb(undefined);

    const result = await getCurrentUser(createUserProcedureContext(db));

    assert.equal(result, null);
  });
});

describe("listCurrentUserOrganizations", () => {
  test("returns organizations for authenticated requests", async () => {
    const rows = [
      {
        organization: {
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          id: "550e8400-e29b-41d4-a716-446655440000",
          logo: null,
          metadata: null,
          name: "Acme Org",
          settings: null,
          slug: "acme-org",
        },
      },
      {
        organization: {
          createdAt: new Date("2024-01-02T00:00:00.000Z"),
          id: "550e8400-e29b-41d4-a716-446655440001",
          logo: null,
          metadata: null,
          name: "Beta Org",
          settings: null,
          slug: "beta-org",
        },
      },
    ];
    const { db, state } = createMockSequentialSelectDb([rows]);

    const result = await listCurrentUserOrganizations(createUserProcedureContext(db));

    assert.deepEqual(
      result,
      rows.map((row) => row.organization)
    );
    assert.equal(state.joinCounts[0], 1);
    assert.notEqual(state.whereValues[0], undefined);
  });

  test("returns an empty array for anonymous requests", async () => {
    const { db, state } = createMockSequentialSelectDb([]);

    const result = await listCurrentUserOrganizations(createAnonymousProcedureContext(db));

    assert.deepEqual(result, []);
    assert.deepEqual(state.selections, []);
  });
});
