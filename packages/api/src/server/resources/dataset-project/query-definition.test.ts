import { QueryBuilder } from "drizzle-orm/pg-core";
import assert from "node:assert/strict";
import { describe, test } from "vitest";
import {
  compileDrizzleCollectionOrderBy,
  compileDrizzleCollectionWhere,
  parseCollectionQuery,
} from "../../collection-query";
import { datasetProjectQueryDefinition } from "./query-definition";

describe("datasetProjectQueryDefinition", () => {
  test("supports scalar dataset project filters and ordering", () => {
    const collectionQuery = parseCollectionQuery(datasetProjectQueryDefinition, {
      datasetId: "eq.550e8400-e29b-41d4-a716-446655440000",
      order: "projectId.asc",
      projectId: "eq.550e8400-e29b-41d4-a716-446655440001",
    });

    assert.deepEqual(
      collectionQuery.orderBy.map((order) => ({ direction: order.direction, field: order.field })),
      [{ direction: "asc", field: "projectId" }]
    );

    const qb = new QueryBuilder();
    const query = qb
      .select()
      .from(datasetProjectQueryDefinition.table)
      .where(compileDrizzleCollectionWhere(datasetProjectQueryDefinition, collectionQuery))
      .orderBy(...compileDrizzleCollectionOrderBy(datasetProjectQueryDefinition, collectionQuery))
      .limit(collectionQuery.limit)
      .offset(collectionQuery.offset);

    const { params, sql } = query.toSQL();

    assert.match(sql, /"dataset_projects"/);
    assert.ok(params.includes("550e8400-e29b-41d4-a716-446655440000"));
    assert.ok(params.includes("550e8400-e29b-41d4-a716-446655440001"));
  });

  test("supports dataset and project relationship filters, ordering, and search", () => {
    const collectionQuery = parseCollectionQuery(datasetProjectQueryDefinition, {
      embed: "dataset,project",
      order: "project:name.asc,dataset:name.desc",
      "project:slug": "eq.acme-project",
      search: "acme",
    });

    assert.deepEqual(collectionQuery.embeds, ["dataset", "project"]);
    assert.deepEqual(
      collectionQuery.orderBy.map((order) => ({
        direction: order.direction,
        field: order.field,
        relationship: order.relationship,
      })),
      [
        { direction: "asc", field: "name", relationship: "project" },
        { direction: "desc", field: "name", relationship: "dataset" },
      ]
    );

    const qb = new QueryBuilder();
    const query = qb
      .select()
      .from(datasetProjectQueryDefinition.table)
      .innerJoin(
        datasetProjectQueryDefinition.relationships.dataset.table,
        datasetProjectQueryDefinition.relationships.dataset.join
      )
      .innerJoin(
        datasetProjectQueryDefinition.relationships.project.table,
        datasetProjectQueryDefinition.relationships.project.join
      )
      .where(compileDrizzleCollectionWhere(datasetProjectQueryDefinition, collectionQuery))
      .orderBy(...compileDrizzleCollectionOrderBy(datasetProjectQueryDefinition, collectionQuery))
      .limit(collectionQuery.limit)
      .offset(collectionQuery.offset);

    const { params, sql } = query.toSQL();

    assert.match(sql, /"dataset_projects"/);
    assert.match(sql, /"datasets"/);
    assert.match(sql, /"projects"/);
    assert.ok(params.includes("acme-project"));
    assert.ok(params.includes("%acme%"));
  });
});
