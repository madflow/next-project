import { type SQL, and, asc, desc, eq, gt, gte, ilike, isNull, like, lt, lte, ne, or } from "drizzle-orm";
import type { CollectionFilter, CollectionQuery, CollectionQueryDefinition } from "./definition";
import { resolveCollectionField } from "./definition";

function normalizeLikePattern(value: string) {
  return value.replace(/\*/g, "%");
}

function normalizeSearchPattern(value: string) {
  return `%${value.replace(/[%_]/g, "\\$&")}%`;
}

function compileDrizzleCollectionFilter(definition: CollectionQueryDefinition, filter: CollectionFilter): SQL<unknown> {
  const { fieldDefinition } = resolveCollectionField(definition, filter.field, filter.relationship);
  if (!fieldDefinition.filterable) {
    throw new Error(`Field '${filter.field}' does not support filtering`);
  }

  switch (filter.operator) {
    case "eq":
      return eq(fieldDefinition.column, filter.value);
    case "neq":
      return ne(fieldDefinition.column, filter.value);
    case "gt":
      return gt(fieldDefinition.column, filter.value);
    case "gte":
      return gte(fieldDefinition.column, filter.value);
    case "lt":
      return lt(fieldDefinition.column, filter.value);
    case "lte":
      return lte(fieldDefinition.column, filter.value);
    case "like":
      return like(fieldDefinition.column, normalizeLikePattern(String(filter.value)));
    case "ilike":
      return ilike(fieldDefinition.column, normalizeLikePattern(String(filter.value)));
    case "is":
      return filter.value === null ? isNull(fieldDefinition.column) : eq(fieldDefinition.column, filter.value);
  }
}

function compileDrizzleCollectionSearch(
  definition: CollectionQueryDefinition,
  query: CollectionQuery
): SQL<unknown> | undefined {
  if (!query.search || query.searchBy.length === 0) {
    return undefined;
  }

  const search = query.search;

  const searchConditions = query.searchBy.map((searchField) => {
    const { fieldDefinition } = resolveCollectionField(definition, searchField.field, searchField.relationship);

    return ilike(fieldDefinition.column, normalizeSearchPattern(search));
  });

  return searchConditions.length === 1 ? searchConditions[0] : or(...searchConditions);
}

export function compileDrizzleCollectionWhere(
  definition: CollectionQueryDefinition,
  query: CollectionQuery
): SQL<unknown> | undefined {
  const conditions = query.filters.map((filter) => compileDrizzleCollectionFilter(definition, filter));
  const searchCondition = compileDrizzleCollectionSearch(definition, query);

  if (searchCondition) {
    conditions.unshift(searchCondition);
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return conditions.length === 1 ? conditions[0] : and(...conditions);
}

export function compileDrizzleCollectionOrderBy(
  definition: CollectionQueryDefinition,
  query: CollectionQuery
): SQL<unknown>[] {
  return query.orderBy.map((order) => {
    const { fieldDefinition } = resolveCollectionField(definition, order.field, order.relationship);
    if (!fieldDefinition.sortable) {
      throw new Error(`Field '${order.field}' does not support sorting`);
    }

    return order.direction === "desc" ? desc(fieldDefinition.column) : asc(fieldDefinition.column);
  });
}
