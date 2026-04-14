import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { HttpException } from "@/lib/exception";
import { processUrlParams } from "./handler";

describe("processUrlParams", () => {
  test("parses pagination and excludes reserved params from filters", () => {
    const params = new URLSearchParams({
      limit: "25",
      offset: "5",
      search: "survey",
      order: "name.asc",
      status: "active",
    });

    const result = processUrlParams(params);

    assert.equal(result.limit, 25);
    assert.equal(result.offset, 5);
    assert.equal(result.search, "survey");
    assert.deepEqual(result.orderBy, [{ column: "name", direction: "asc" }]);
    assert.deepEqual(result.filters, [{ column: "status", operator: "=", value: "active" }]);
  });

  test("supports route-specific reserved params", () => {
    const params = new URLSearchParams({
      unassigned: "true",
      hierarchical: "true",
      name: "set-a",
    });

    const result = processUrlParams(params, { reservedParams: ["unassigned", "hierarchical"] });

    assert.deepEqual(result.filters, [{ column: "name", operator: "=", value: "set-a" }]);
  });

  test("throws bad request for invalid limit", () => {
    assert.throws(
      () => processUrlParams(new URLSearchParams({ limit: "0" })),
      (error: unknown) => error instanceof HttpException && error.status === 400 && error.message.includes("limit")
    );
  });

  test("throws bad request for invalid offset", () => {
    assert.throws(
      () => processUrlParams(new URLSearchParams({ offset: "-1" })),
      (error: unknown) => error instanceof HttpException && error.status === 400 && error.message.includes("offset")
    );
  });

  test("throws bad request for invalid order direction", () => {
    assert.throws(
      () => processUrlParams(new URLSearchParams({ order: "name.sideways" })),
      (error: unknown) => error instanceof HttpException && error.status === 400 && error.message.includes("direction")
    );
  });
});
