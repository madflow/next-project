import { QueryBuilder } from "drizzle-orm/pg-core";
import assert from "node:assert/strict";
import { describe, test } from "vitest";
import {
  compileDrizzleCollectionOrderBy,
  compileDrizzleCollectionWhere,
  parseCollectionQuery,
} from "../../collection-query";
import { projectQueryDefinition } from "./query-definition";

describe("projectQueryDefinition", () => {
  test("supports scalar project filters and ordering", () => {
    const collectionQuery = parseCollectionQuery(projectQueryDefinition, {
      limit: "15",
      name: "ilike.*acme*",
      order: "createdAt.desc,name.asc",
      organizationId: "eq.550e8400-e29b-41d4-a716-446655440000",
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
      .from(projectQueryDefinition.table)
      .where(compileDrizzleCollectionWhere(projectQueryDefinition, collectionQuery))
      .orderBy(...compileDrizzleCollectionOrderBy(projectQueryDefinition, collectionQuery))
      .limit(collectionQuery.limit)
      .offset(collectionQuery.offset);

    const { params, sql } = query.toSQL();

    assert.match(sql, /"projects"/);
    assert.match(sql, /ilike/);
    assert.ok(params.includes("550e8400-e29b-41d4-a716-446655440000"));
    assert.ok(params.includes("%acme%"));
  });

  test("supports organization relationship filters, ordering, and embeds", () => {
    const collectionQuery = parseCollectionQuery(projectQueryDefinition, {
      embed: "organization",
      "organization:name": "ilike.*acme*",
      order: "organization:name.asc,name.desc",
    });

    assert.deepEqual(collectionQuery.embeds, ["organization"]);
    assert.deepEqual(
      collectionQuery.orderBy.map((order) => ({
        direction: order.direction,
        field: order.field,
        relationship: order.relationship,
      })),
      [
        { direction: "asc", field: "name", relationship: "organization" },
        { direction: "desc", field: "name", relationship: undefined },
      ]
    );

    const qb = new QueryBuilder();
    const query = qb
      .select()
      .from(projectQueryDefinition.table)
      .innerJoin(
        projectQueryDefinition.relationships.organization.table,
        projectQueryDefinition.relationships.organization.join
      )
      .where(compileDrizzleCollectionWhere(projectQueryDefinition, collectionQuery))
      .orderBy(...compileDrizzleCollectionOrderBy(projectQueryDefinition, collectionQuery))
      .limit(collectionQuery.limit)
      .offset(collectionQuery.offset);

    const { params, sql } = query.toSQL();

    assert.match(sql, /"organizations"/);
    assert.match(sql, /ilike/);
    assert.ok(params.includes("%acme%"));
  });

  test("rejects json fields for scalar filtering", () => {
    assert.throws(
      () => parseCollectionQuery(projectQueryDefinition, { metadata: "eq.theme" }),
      (error: unknown) => {
        const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
        return message.includes("Field 'metadata' does not support filtering");
      }
    );
  });

  test("rejects unknown embeds", () => {
    assert.throws(
      () => parseCollectionQuery(projectQueryDefinition, { embed: "owner" }),
      (error: unknown) => {
        const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
        return message.includes("Unknown embed 'owner'");
      }
    );
  });
});
