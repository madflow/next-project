import { QueryBuilder } from "drizzle-orm/pg-core";
import assert from "node:assert/strict";
import { describe, test } from "vitest";
import {
  compileDrizzleCollectionOrderBy,
  compileDrizzleCollectionWhere,
  parseCollectionQuery,
} from "../../collection-query";
import { datasetSplitVariableQueryDefinition } from "./query-definition";

describe("datasetSplitVariableQueryDefinition", () => {
  test("supports scalar dataset split variable filters and ordering", () => {
    const collectionQuery = parseCollectionQuery(datasetSplitVariableQueryDefinition, {
      datasetId: "eq.550e8400-e29b-41d4-a716-446655440000",
      order: "createdAt.desc",
      variableId: "eq.550e8400-e29b-41d4-a716-446655440001",
    });

    assert.deepEqual(
      collectionQuery.orderBy.map((order) => ({ direction: order.direction, field: order.field })),
      [{ direction: "desc", field: "createdAt" }]
    );

    const qb = new QueryBuilder();
    const query = qb
      .select()
      .from(datasetSplitVariableQueryDefinition.table)
      .where(compileDrizzleCollectionWhere(datasetSplitVariableQueryDefinition, collectionQuery))
      .orderBy(...compileDrizzleCollectionOrderBy(datasetSplitVariableQueryDefinition, collectionQuery))
      .limit(collectionQuery.limit)
      .offset(collectionQuery.offset);

    const { params, sql } = query.toSQL();

    assert.match(sql, /"dataset_splitvariables"/);
    assert.ok(params.includes("550e8400-e29b-41d4-a716-446655440000"));
    assert.ok(params.includes("550e8400-e29b-41d4-a716-446655440001"));
  });

  test("supports dataset and variable relationship filters, ordering, and search", () => {
    const collectionQuery = parseCollectionQuery(datasetSplitVariableQueryDefinition, {
      embed: "dataset,variable",
      "variable:name": "eq.gender",
      order: "variable:name.asc,dataset:name.desc",
      search: "gender",
    });

    assert.deepEqual(collectionQuery.embeds, ["dataset", "variable"]);
    assert.deepEqual(
      collectionQuery.orderBy.map((order) => ({
        direction: order.direction,
        field: order.field,
        relationship: order.relationship,
      })),
      [
        { direction: "asc", field: "name", relationship: "variable" },
        { direction: "desc", field: "name", relationship: "dataset" },
      ]
    );

    const qb = new QueryBuilder();
    const query = qb
      .select()
      .from(datasetSplitVariableQueryDefinition.table)
      .innerJoin(
        datasetSplitVariableQueryDefinition.relationships.dataset.table,
        datasetSplitVariableQueryDefinition.relationships.dataset.join
      )
      .innerJoin(
        datasetSplitVariableQueryDefinition.relationships.variable.table,
        datasetSplitVariableQueryDefinition.relationships.variable.join
      )
      .where(compileDrizzleCollectionWhere(datasetSplitVariableQueryDefinition, collectionQuery))
      .orderBy(...compileDrizzleCollectionOrderBy(datasetSplitVariableQueryDefinition, collectionQuery))
      .limit(collectionQuery.limit)
      .offset(collectionQuery.offset);

    const { params, sql } = query.toSQL();

    assert.match(sql, /"dataset_splitvariables"/);
    assert.match(sql, /"datasets"/);
    assert.match(sql, /"dataset_variables"/);
    assert.ok(params.includes("gender"));
    assert.ok(params.includes("%gender%"));
  });
});
