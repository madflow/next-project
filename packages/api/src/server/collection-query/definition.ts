import type { SQL } from "drizzle-orm";
import type { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core";

export const filterOperators = ["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "is"] as const;

export type FieldKind = "string" | "uuid" | "number" | "boolean" | "date" | "json";
export type FilterOperator = (typeof filterOperators)[number];
type OrderDirection = "asc" | "desc";
export type FilterValue = boolean | Date | null | number | string;

export type CollectionQueryField<TColumn extends AnyPgColumn = AnyPgColumn> = {
  column: TColumn;
  filterable: boolean;
  kind: FieldKind;
  sortable: boolean;
};

type CollectionQueryRelationship<
  TTable extends AnyPgTable = AnyPgTable,
  TFields extends Record<string, CollectionQueryField> = Record<string, CollectionQueryField>,
> = {
  fields: TFields;
  join: SQL<unknown>;
  table: TTable;
};

export type CollectionQueryDefinition<
  TTable extends AnyPgTable = AnyPgTable,
  TFields extends Record<string, CollectionQueryField> = Record<string, CollectionQueryField>,
  TRelationships extends Record<string, CollectionQueryRelationship> = Record<string, CollectionQueryRelationship>,
> = {
  relationships?: TRelationships;
  searchFields?: string[];
  table: TTable;
  fields: TFields;
};

export type CollectionFilter = {
  field: string;
  relationship?: string;
  operator: FilterOperator;
  value: FilterValue;
};

type CollectionOrder = {
  direction: OrderDirection;
  field: string;
  relationship?: string;
};

export type CollectionSearchField = {
  field: string;
  relationship?: string;
};

export type CollectionQuery = {
  embeds: string[];
  filters: CollectionFilter[];
  limit: number;
  offset: number;
  orderBy: CollectionOrder[];
  search?: string;
  searchBy: CollectionSearchField[];
};

export type CollectionFieldReference =
  | { field: string; fieldDefinition: CollectionQueryField; relationship?: undefined }
  | { field: string; fieldDefinition: CollectionQueryField; relationship: string };

type CollectionFieldPath = {
  field: string;
  relationship?: string;
};

function parseCollectionFieldPath(definition: CollectionQueryDefinition, rawField: string): CollectionFieldPath | null {
  const segments = rawField.split(":");

  if (segments.length === 1) {
    return { field: rawField };
  }

  if (segments.length !== 2) {
    return null;
  }

  const [relationship, field] = segments;
  if (!relationship || !field) {
    return null;
  }

  if (!definition.relationships?.[relationship]) {
    return null;
  }

  return { field, relationship };
}

export function resolveCollectionField(
  definition: CollectionQueryDefinition,
  field: string,
  relationship?: string
): CollectionFieldReference {
  if (relationship) {
    const fieldDefinition = definition.relationships?.[relationship]?.fields[field];
    if (!fieldDefinition) {
      throw new Error(`Unknown collection field '${relationship}:${field}'`);
    }

    return {
      field,
      fieldDefinition,
      relationship,
    };
  }

  const fieldDefinition = definition.fields[field];
  if (!fieldDefinition) {
    throw new Error(`Unknown collection field '${field}'`);
  }

  return {
    field,
    fieldDefinition,
  };
}

export function resolveRawCollectionField(
  definition: CollectionQueryDefinition,
  rawField: string
): CollectionFieldReference {
  const fieldPath = parseCollectionFieldPath(definition, rawField);
  if (!fieldPath) {
    throw new Error(`Unknown collection field '${rawField}'`);
  }

  return resolveCollectionField(definition, fieldPath.field, fieldPath.relationship);
}
