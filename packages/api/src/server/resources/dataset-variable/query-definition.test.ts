import { QueryBuilder } from "drizzle-orm/pg-core";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  compileDrizzleCollectionOrderBy,
  compileDrizzleCollectionWhere,
  parseCollectionQuery,
} from "../../collection-query";
import { datasetVariableQueryDefinition } from "./query-definition";

describe("datasetVariableQueryDefinition", () => {
  test("supports scalar dataset variable filters and ordering", () => {
    const collectionQuery = parseCollectionQuery(datasetVariableQueryDefinition, {
      datasetId: "eq.550e8400-e29b-41d4-a716-446655440000",
      limit: "15",
      name: "ilike.*age*",
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
      .from(datasetVariableQueryDefinition.table)
      .where(compileDrizzleCollectionWhere(datasetVariableQueryDefinition, collectionQuery))
      .orderBy(...compileDrizzleCollectionOrderBy(datasetVariableQueryDefinition, collectionQuery))
      .limit(collectionQuery.limit)
      .offset(collectionQuery.offset);

    const { params, sql } = query.toSQL();

    assert.match(sql, /"dataset_variables"/);
    assert.match(sql, /ilike/);
    assert.ok(params.includes("550e8400-e29b-41d4-a716-446655440000"));
    assert.ok(params.includes("%age%"));
  });

  test("supports dataset relationship filters, ordering, and embeds", () => {
    const collectionQuery = parseCollectionQuery(datasetVariableQueryDefinition, {
      embed: "dataset",
      "dataset:name": "ilike.*acme*",
      order: "dataset:name.asc,name.desc",
    });

    assert.deepEqual(collectionQuery.embeds, ["dataset"]);
    assert.deepEqual(
      collectionQuery.orderBy.map((order) => ({
        direction: order.direction,
        field: order.field,
        relationship: order.relationship,
      })),
      [
        { direction: "asc", field: "name", relationship: "dataset" },
        { direction: "desc", field: "name", relationship: undefined },
      ]
    );

    const qb = new QueryBuilder();
    const query = qb
      .select()
      .from(datasetVariableQueryDefinition.table)
      .innerJoin(
        datasetVariableQueryDefinition.relationships.dataset.table,
        datasetVariableQueryDefinition.relationships.dataset.join
      )
      .where(compileDrizzleCollectionWhere(datasetVariableQueryDefinition, collectionQuery))
      .orderBy(...compileDrizzleCollectionOrderBy(datasetVariableQueryDefinition, collectionQuery))
      .limit(collectionQuery.limit)
      .offset(collectionQuery.offset);

    const { params, sql } = query.toSQL();

    assert.match(sql, /"datasets"/);
    assert.match(sql, /ilike/);
    assert.ok(params.includes("%acme%"));
  });

  test("rejects json fields for scalar filtering", () => {
    assert.throws(
      () => parseCollectionQuery(datasetVariableQueryDefinition, { missingValues: "eq.value" }),
      (error: unknown) => {
        const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
        return message.includes("Field 'missingValues' does not support filtering");
      }
    );
  });
});
