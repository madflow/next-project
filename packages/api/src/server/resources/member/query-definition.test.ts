import { QueryBuilder } from "drizzle-orm/pg-core";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  compileDrizzleCollectionOrderBy,
  compileDrizzleCollectionWhere,
  parseCollectionQuery,
} from "../../collection-query";
import { memberQueryDefinition } from "./query-definition";

describe("memberQueryDefinition", () => {
  test("supports scalar member filters and ordering", () => {
    const collectionQuery = parseCollectionQuery(memberQueryDefinition, {
      limit: "15",
      order: "createdAt.desc,role.asc",
      organizationId: "eq.550e8400-e29b-41d4-a716-446655440000",
      role: "eq.admin",
    });

    assert.equal(collectionQuery.limit, 15);
    assert.equal(collectionQuery.offset, 0);
    assert.deepEqual(
      collectionQuery.orderBy.map((order) => ({ direction: order.direction, field: order.field })),
      [
        { direction: "desc", field: "createdAt" },
        { direction: "asc", field: "role" },
      ]
    );

    const qb = new QueryBuilder();
    const query = qb
      .select()
      .from(memberQueryDefinition.table)
      .where(compileDrizzleCollectionWhere(memberQueryDefinition, collectionQuery))
      .orderBy(...compileDrizzleCollectionOrderBy(memberQueryDefinition, collectionQuery))
      .limit(collectionQuery.limit)
      .offset(collectionQuery.offset);

    const { params, sql } = query.toSQL();

    assert.match(sql, /"members"/);
    assert.match(sql, /order by/);
    assert.ok(params.includes("550e8400-e29b-41d4-a716-446655440000"));
    assert.ok(params.includes("admin"));
  });

  test("supports organization and user relationship filters, ordering, and embeds", () => {
    const collectionQuery = parseCollectionQuery(memberQueryDefinition, {
      embed: "organization,user",
      "organization:name": "eq.Acme Org",
      "user:email": "ilike.*example.com*",
      order: "organization:name.asc,user:name.desc,role.desc",
    });

    assert.deepEqual(collectionQuery.embeds, ["organization", "user"]);
    assert.deepEqual(collectionQuery.filters, [
      { field: "name", operator: "eq", relationship: "organization", value: "Acme Org" },
      { field: "email", operator: "ilike", relationship: "user", value: "*example.com*" },
    ]);
    assert.deepEqual(
      collectionQuery.orderBy.map((order) => ({
        direction: order.direction,
        field: order.field,
        relationship: order.relationship,
      })),
      [
        { direction: "asc", field: "name", relationship: "organization" },
        { direction: "desc", field: "name", relationship: "user" },
        { direction: "desc", field: "role", relationship: undefined },
      ]
    );

    const qb = new QueryBuilder();
    const query = qb
      .select()
      .from(memberQueryDefinition.table)
      .innerJoin(
        memberQueryDefinition.relationships.organization.table,
        memberQueryDefinition.relationships.organization.join
      )
      .innerJoin(memberQueryDefinition.relationships.user.table, memberQueryDefinition.relationships.user.join)
      .where(compileDrizzleCollectionWhere(memberQueryDefinition, collectionQuery))
      .orderBy(...compileDrizzleCollectionOrderBy(memberQueryDefinition, collectionQuery))
      .limit(collectionQuery.limit)
      .offset(collectionQuery.offset);

    const { params, sql } = query.toSQL();

    assert.match(sql, /"organizations"/);
    assert.match(sql, /"users"/);
    assert.match(sql, /ilike/);
    assert.ok(params.includes("Acme Org"));
    assert.ok(params.includes("%example.com%"));
  });

  test("rejects unknown embeds", () => {
    assert.throws(
      () => parseCollectionQuery(memberQueryDefinition, { embed: "owner" }),
      (error: unknown) => {
        const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
        return message.includes("Unknown embed 'owner'");
      }
    );
  });
});
