import { QueryBuilder } from "drizzle-orm/pg-core";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  compileDrizzleCollectionOrderBy,
  compileDrizzleCollectionWhere,
  parseCollectionQuery,
} from "../../collection-query";
import { organizationQueryDefinition } from "./query-definition";

describe("organizationQueryDefinition", () => {
  test("supports scalar organization filters and ordering", () => {
    const collectionQuery = parseCollectionQuery(organizationQueryDefinition, {
      createdAt: "gte.2024-01-01T00:00:00.000Z",
      limit: "15",
      name: "ilike.*acme*",
      order: "createdAt.desc,name.asc",
    });

    assert.equal(collectionQuery.limit, 15);
    assert.equal(collectionQuery.offset, 0);
    assert.deepEqual(
      collectionQuery.orderBy.map((order) => ({ direction: order.direction, field: order.field })),
      [
        { direction: "desc", field: "createdAt" },
        { direction: "asc", field: "name" },
      ]
    );

    const qb = new QueryBuilder();
    const query = qb
      .select()
      .from(organizationQueryDefinition.table)
      .where(compileDrizzleCollectionWhere(organizationQueryDefinition, collectionQuery))
      .orderBy(...compileDrizzleCollectionOrderBy(organizationQueryDefinition, collectionQuery))
      .limit(collectionQuery.limit)
      .offset(collectionQuery.offset);

    const { params, sql } = query.toSQL();

    assert.match(sql, /"organizations"/);
    assert.match(sql, /ilike/);
    assert.equal(params[0], "2024-01-01T00:00:00.000Z");
    assert.equal(params[1], "%acme%");
  });

  test("rejects json fields for scalar filtering", () => {
    assert.throws(
      () => parseCollectionQuery(organizationQueryDefinition, { settings: "eq.theme" }),
      (error: unknown) => {
        const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
        return message.includes("Field 'settings' does not support filtering");
      }
    );
  });
});
