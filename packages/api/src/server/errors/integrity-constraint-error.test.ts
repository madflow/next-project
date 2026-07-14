import { ORPCError } from "@orpc/server";
import assert from "node:assert/strict";
import { describe, test } from "vitest";
import { toIntegrityConstraintORPCError } from "./integrity-constraint-error";

function createQueryError(cause: Record<string, unknown>) {
  return Object.assign(new Error("Failed query"), { cause });
}

describe("toIntegrityConstraintORPCError", () => {
  test("maps supported integrity constraint codes to oRPC errors", () => {
    const cases = [
      { errorCode: "23000", expectedCode: "INTEGRITY_CONSTRAINT_VIOLATION", expectedStatus: 409 },
      { errorCode: "23001", expectedCode: "RESTRICT_VIOLATION", expectedStatus: 409 },
      { errorCode: "23502", expectedCode: "NOT_NULL_VIOLATION", expectedStatus: 422 },
      { errorCode: "23503", expectedCode: "FOREIGN_KEY_VIOLATION", expectedStatus: 409 },
      { errorCode: "23505", expectedCode: "UNIQUE_VIOLATION", expectedStatus: 409 },
      { errorCode: "23514", expectedCode: "CHECK_VIOLATION", expectedStatus: 422 },
    ];

    for (const testCase of cases) {
      const mapped = toIntegrityConstraintORPCError(createQueryError({ code: testCase.errorCode }));

      assert.ok(mapped instanceof ORPCError);
      assert.equal(mapped.code, testCase.expectedCode);
      assert.equal(mapped.status, testCase.expectedStatus);
      assert.deepEqual(mapped.data, getExpectedData(testCase.errorCode));
    }
  });

  test("extracts detail fields and values from key-based constraint errors", () => {
    const mapped = toIntegrityConstraintORPCError(
      createQueryError({
        code: "23503",
        detail: 'Key (organization_id, user_id)=(org_1, user_1) is not present in table "members".',
      })
    );

    assert.ok(mapped instanceof ORPCError);
    assert.deepEqual(mapped.data, {
      fields: ["organization_id", "user_id"],
      reason: "missing_reference",
    });
  });

  test("maps still-referenced foreign key errors as restricted operations", () => {
    const mapped = toIntegrityConstraintORPCError(
      createQueryError({
        code: "23503",
        constraint: "projects_organization_id_organizations_id_fk",
        detail: 'Key (id)=(org_1) is still referenced from table "projects".',
      })
    );

    assert.ok(mapped instanceof ORPCError);
    assert.equal(mapped.code, "FOREIGN_KEY_VIOLATION");
    assert.equal(mapped.message, "Record is still referenced by other data");
    assert.deepEqual(mapped.data, {
      fields: ["id"],
      reason: "restricted",
    });
  });

  test("falls back to the generic integrity error for unknown class 23 codes", () => {
    const mapped = toIntegrityConstraintORPCError(createQueryError({ code: "23P01" }));

    assert.ok(mapped instanceof ORPCError);
    assert.equal(mapped.code, "INTEGRITY_CONSTRAINT_VIOLATION");
    assert.equal(mapped.status, 409);
    assert.deepEqual(mapped.data, {
      fields: undefined,
      reason: "conflict",
    });
  });

  test("returns undefined for non-postgres errors", () => {
    assert.equal(toIntegrityConstraintORPCError(new Error("boom")), undefined);
    assert.equal(toIntegrityConstraintORPCError({ code: "42P01" }), undefined);
  });
});

function getExpectedData(errorCode: string) {
  switch (errorCode) {
    case "23001":
      return { fields: undefined, reason: "restricted" };
    case "23502":
      return { fields: undefined, reason: "required" };
    case "23503":
      return { fields: undefined, reason: "missing_reference" };
    case "23505":
      return { fields: undefined, reason: "already_exists" };
    case "23514":
      return { fields: undefined, reason: "invalid" };
    default:
      return { fields: undefined, reason: "conflict" };
  }
}
