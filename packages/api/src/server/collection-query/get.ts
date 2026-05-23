import { ORPCError } from "@orpc/server";
import { getTableColumns } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { SelectedFields } from "drizzle-orm/pg-core/query-builders/select.types";
import type { DatabaseInstance } from "@repo/database/clients";
import type { CollectionQueryDefinition } from "./definition";
import { formatCollectionQueryValidationError, isCollectionQueryValidationError, parseCollectionQuery } from "./parse";

function toEmbedInput(input: unknown) {
  if (!input || typeof input !== "object") {
    return {};
  }

  return {
    embed: "embed" in input ? (input as { embed?: unknown }).embed : undefined,
  };
}

type GetCollectionRowOptions = {
  db: DatabaseInstance;
  definition: CollectionQueryDefinition;
  input: unknown;
  baseSelection?: SelectedFields;
  embedSelections?: Record<string, SelectedFields>;
  where?: SQL<unknown>;
};

function buildRowSelection(
  definition: CollectionQueryDefinition,
  embeds: string[],
  baseSelection?: SelectedFields,
  embedSelections?: Record<string, SelectedFields>
) {
  const rowSelection: SelectedFields = baseSelection ? { ...baseSelection } : { ...getTableColumns(definition.table) };

  for (const embed of embeds) {
    const relationship = definition.relationships?.[embed];
    if (!relationship) {
      continue;
    }

    const embedSelection = embedSelections?.[embed] ?? getTableColumns(relationship.table);
    (rowSelection as Record<string, unknown>)[embed] = embedSelection;
  }

  return rowSelection;
}

export async function getCollectionRow<TRow>({
  db,
  definition,
  input,
  baseSelection,
  embedSelections,
  where,
}: GetCollectionRowOptions): Promise<TRow | undefined> {
  try {
    const collectionQuery = parseCollectionQuery(definition, toEmbedInput(input));
    const rowSelection = buildRowSelection(definition, collectionQuery.embeds, baseSelection, embedSelections);

    let query = db.select(rowSelection).from(definition.table).$dynamic();

    for (const embed of collectionQuery.embeds) {
      const relationship = definition.relationships?.[embed];
      if (!relationship) {
        continue;
      }

      query = query.innerJoin(relationship.table, relationship.join);
    }

    if (where) {
      query = query.where(where);
    }

    const rows = await query.limit(1).execute();
    return rows[0] as TRow | undefined;
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
