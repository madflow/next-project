import { QueryBuilder } from "drizzle-orm/pg-core";
import assert from "node:assert/strict";
import { describe, test } from "vitest";
import {
  compileDrizzleCollectionOrderBy,
  compileDrizzleCollectionWhere,
  parseCollectionQuery,
} from "../../collection-query";
import { datasetVariablesetQueryDefinition } from "./query-definition";

describe("datasetVariablesetQueryDefinition", () => {
  test("supports scalar dataset variableset filters and ordering", () => {
    const collectionQuery = parseCollectionQuery(datasetVariablesetQueryDefinition, {
      category: "eq.general",
      datasetId: "eq.550e8400-e29b-41d4-a716-446655440000",
      limit: "15",
      order: "orderIndex.asc,name.asc",
    });

    assert.equal(collectionQuery.limit, 15);
    assert.equal(collectionQuery.offset, 0);
    assert.deepEqual(
      collectionQuery.orderBy.map((order) => ({ direction: order.direction, field: order.field })),
      [
        { direction: "asc", field: "orderIndex" },
        { direction: "asc", field: "name" },
      ]
    );

    const qb = new QueryBuilder();
    const query = qb
      .select()
      .from(datasetVariablesetQueryDefinition.table)
      .where(compileDrizzleCollectionWhere(datasetVariablesetQueryDefinition, collectionQuery))
      .orderBy(...compileDrizzleCollectionOrderBy(datasetVariablesetQueryDefinition, collectionQuery))
      .limit(collectionQuery.limit)
      .offset(collectionQuery.offset);

    const { params, sql } = query.toSQL();

    assert.match(sql, /"dataset_variablesets"/);
    assert.ok(params.includes("general"));
    assert.ok(params.includes("550e8400-e29b-41d4-a716-446655440000"));
  });

  test("supports dataset and parent relationship filters, ordering, and embeds", () => {
    const collectionQuery = parseCollectionQuery(datasetVariablesetQueryDefinition, {
      embed: "dataset,parent",
      "dataset:name": "ilike.*survey*",
      "parent:name": "eq.Demographics",
      order: "parent:name.asc,name.desc",
    });

    assert.deepEqual(collectionQuery.embeds, ["dataset", "parent"]);
    assert.deepEqual(
      collectionQuery.orderBy.map((order) => ({
        direction: order.direction,
        field: order.field,
        relationship: order.relationship,
      })),
      [
        { direction: "asc", field: "name", relationship: "parent" },
        { direction: "desc", field: "name", relationship: undefined },
      ]
    );

    const qb = new QueryBuilder();
    const query = qb
      .select()
      .from(datasetVariablesetQueryDefinition.table)
      .innerJoin(
        datasetVariablesetQueryDefinition.relationships.dataset.table,
        datasetVariablesetQueryDefinition.relationships.dataset.join
      )
      .innerJoin(
        datasetVariablesetQueryDefinition.relationships.parent.table,
        datasetVariablesetQueryDefinition.relationships.parent.join
      )
      .where(compileDrizzleCollectionWhere(datasetVariablesetQueryDefinition, collectionQuery))
      .orderBy(...compileDrizzleCollectionOrderBy(datasetVariablesetQueryDefinition, collectionQuery))
      .limit(collectionQuery.limit)
      .offset(collectionQuery.offset);

    const { params, sql } = query.toSQL();

    assert.match(sql, /"datasets"/);
    assert.match(sql, /"parent_dataset_variableset"/);
    assert.ok(params.includes("%survey%"));
    assert.ok(params.includes("Demographics"));
  });
});
