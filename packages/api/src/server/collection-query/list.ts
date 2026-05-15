import { ORPCError } from "@orpc/server";
import { and, count, getTableColumns } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { SelectedFields } from "drizzle-orm/pg-core/query-builders/select.types";
import type { DatabaseInstance } from "@repo/database/clients";
import type { CollectionQuery, CollectionQueryDefinition } from "./definition";
import { compileDrizzleCollectionOrderBy, compileDrizzleCollectionWhere } from "./drizzle";
import { formatCollectionQueryValidationError, isCollectionQueryValidationError, parseCollectionQuery } from "./parse";

type ListCollectionOptions = {
  db: DatabaseInstance;
  definition: CollectionQueryDefinition;
  input: unknown;
  baseSelection?: SelectedFields;
  embedSelections?: Record<string, SelectedFields>;
  where?: SQL<unknown>;
};

type ListCollectionResult<TRow> = {
  count: number;
  limit: number;
  offset: number;
  orderBy?: CollectionQuery["orderBy"];
  rows: TRow[];
};

function normalizeOrderBy(orderBy: CollectionQuery["orderBy"]) {
  if (orderBy.length === 0) {
    return undefined;
  }

  return orderBy.map((item) =>
    item.relationship
      ? item
      : {
          direction: item.direction,
          field: item.field,
        }
  );
}

function getUsedRelationshipNames(collectionQuery: CollectionQuery) {
  const relationshipNames = new Set<string>(collectionQuery.embeds);

  for (const filter of collectionQuery.filters) {
    if (filter.relationship) {
      relationshipNames.add(filter.relationship);
    }
  }

  for (const order of collectionQuery.orderBy) {
    if (order.relationship) {
      relationshipNames.add(order.relationship);
    }
  }

  for (const searchField of collectionQuery.searchBy) {
    if (searchField.relationship) {
      relationshipNames.add(searchField.relationship);
    }
  }

  return Array.from(relationshipNames);
}

function buildRowSelection(
  definition: CollectionQueryDefinition,
  collectionQuery: CollectionQuery,
  baseSelection?: SelectedFields,
  embedSelections?: Record<string, SelectedFields>
) {
  const rowSelection: SelectedFields = baseSelection ? { ...baseSelection } : { ...getTableColumns(definition.table) };

  for (const embed of collectionQuery.embeds) {
    const relationship = definition.relationships?.[embed];
    if (!relationship) {
      continue;
    }

    const embedSelection = embedSelections?.[embed] ?? getTableColumns(relationship.table);
    (rowSelection as Record<string, unknown>)[embed] = embedSelection;
  }

  return rowSelection;
}

export async function listCollection<TRow>({
  db,
  definition,
  input,
  baseSelection,
  embedSelections,
  where: baseWhere,
}: ListCollectionOptions): Promise<ListCollectionResult<TRow>> {
  try {
    const collectionQuery = parseCollectionQuery(definition, input);
    const rowSelection = buildRowSelection(definition, collectionQuery, baseSelection, embedSelections);
    const usedRelationshipNames = getUsedRelationshipNames(collectionQuery);
    const queryWhere = compileDrizzleCollectionWhere(definition, collectionQuery);
    const where = queryWhere && baseWhere ? and(baseWhere, queryWhere) : (queryWhere ?? baseWhere);
    const orderBy = compileDrizzleCollectionOrderBy(definition, collectionQuery);

    let rowsQuery = db.select(rowSelection).from(definition.table).$dynamic();
    let countQuery = db.select({ count: count() }).from(definition.table).$dynamic();

    for (const relationshipName of usedRelationshipNames) {
      const relationship = definition.relationships?.[relationshipName];
      if (!relationship) {
        continue;
      }

      rowsQuery = rowsQuery.innerJoin(relationship.table, relationship.join);
      countQuery = countQuery.innerJoin(relationship.table, relationship.join);
    }

    if (where) {
      rowsQuery = rowsQuery.where(where);
      countQuery = countQuery.where(where);
    }

    if (orderBy.length > 0) {
      rowsQuery = rowsQuery.orderBy(...orderBy);
    }

    rowsQuery = rowsQuery.limit(collectionQuery.limit).offset(collectionQuery.offset);

    const [rows, countResult] = await Promise.all([
      rowsQuery.execute(),
      countQuery.execute() as Promise<Array<{ count: number | string }>>,
    ]);

    return {
      count: Number(countResult[0]?.count ?? 0),
      limit: collectionQuery.limit,
      offset: collectionQuery.offset,
      orderBy: normalizeOrderBy(collectionQuery.orderBy),
      rows: rows as TRow[],
    };
  } catch (error) {
    if (isCollectionQueryValidationError(error)) {
      throw new ORPCError("INPUT_VALIDATION_FAILED", {
        cause: error,
        message: formatCollectionQueryValidationError(error),
        status: 422,
      });
    }

    throw error;
  }
}
