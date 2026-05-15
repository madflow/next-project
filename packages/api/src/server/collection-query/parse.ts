import { z } from "zod";
import { collectionInputSchema, orderDirectionSchema } from "../../shared/contract/collection";
import {
  type CollectionFilter,
  type CollectionQuery,
  type CollectionQueryDefinition,
  type CollectionQueryField,
  type CollectionSearchField,
  type FieldKind,
  type FilterOperator,
  type FilterValue,
  filterOperators,
  resolveRawCollectionField,
} from "./definition";

const reservedCollectionQueryParams = new Set(["embed", "limit", "offset", "order", "search"]);

const filterOperatorSchema = z.enum(filterOperators);
const booleanFilterValueSchema = z.enum(["true", "false"]).transform((value: "true" | "false") => value === "true");
const isFilterValueSchema = z.enum(["null", "true", "false"]);
const numberFilterValueSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value: string) => Number(value))
  .refine((value: number) => Number.isFinite(value), { message: "Expected a number" });
const dateFilterValueSchema = z
  .string()
  .trim()
  .refine((value: string) => !Number.isNaN(Date.parse(value)), { message: "Expected a valid date string" })
  .transform((value: string) => new Date(value));

type QueryValue = string | string[] | undefined;

const supportedOperatorsByKind: Record<FieldKind, readonly FilterOperator[]> = {
  boolean: ["eq", "neq", "is"],
  date: ["eq", "neq", "gt", "gte", "lt", "lte", "is"],
  json: [],
  number: ["eq", "neq", "gt", "gte", "lt", "lte", "is"],
  string: ["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "is"],
  uuid: ["eq", "neq", "is"],
};

function createIssue(path: PropertyKey[], message: string): z.core.$ZodIssue {
  return {
    code: "custom",
    message,
    path,
  };
}

function parseFilterValue(
  field: string,
  fieldDefinition: CollectionQueryField,
  operator: FilterOperator,
  rawValue: string,
  issues: z.core.$ZodIssue[]
): FilterValue | null {
  if (!supportedOperatorsByKind[fieldDefinition.kind].includes(operator)) {
    issues.push(createIssue([field], `Operator '${operator}' is not supported for '${field}'`));
    return null;
  }

  if (operator === "like" || operator === "ilike") {
    return rawValue;
  }

  if (operator === "is") {
    const parsedIsValue = isFilterValueSchema.safeParse(rawValue);
    if (!parsedIsValue.success) {
      issues.push(createIssue([field], `Invalid 'is' value for '${field}'`));
      return null;
    }

    if (parsedIsValue.data === "null") {
      return null;
    }

    if (fieldDefinition.kind !== "boolean") {
      issues.push(createIssue([field], `Only boolean fields support 'is.true' and 'is.false' for '${field}'`));
      return null;
    }

    return parsedIsValue.data === "true";
  }

  switch (fieldDefinition.kind) {
    case "boolean": {
      const parsedValue = booleanFilterValueSchema.safeParse(rawValue);
      if (!parsedValue.success) {
        issues.push(createIssue([field], `Invalid boolean value for '${field}'`));
        return null;
      }

      return parsedValue.data;
    }
    case "date": {
      const parsedValue = dateFilterValueSchema.safeParse(rawValue);
      if (!parsedValue.success) {
        issues.push(createIssue([field], `Invalid date value for '${field}'`));
        return null;
      }

      return parsedValue.data;
    }
    case "number": {
      const parsedValue = numberFilterValueSchema.safeParse(rawValue);
      if (!parsedValue.success) {
        issues.push(createIssue([field], `Invalid numeric value for '${field}'`));
        return null;
      }

      return parsedValue.data;
    }
    case "string":
      return rawValue;
    case "uuid": {
      const parsedValue = z.string().uuid().safeParse(rawValue);
      if (!parsedValue.success) {
        issues.push(createIssue([field], `Invalid UUID value for '${field}'`));
        return null;
      }

      return parsedValue.data;
    }
    case "json": {
      issues.push(createIssue([field], `'${field}' does not support scalar filtering`));
      return null;
    }
  }
}

function parseCollectionOrder(
  definition: CollectionQueryDefinition,
  rawOrder: string | undefined,
  issues: z.core.$ZodIssue[]
): CollectionQuery["orderBy"] {
  if (!rawOrder) {
    return [];
  }

  const orderBy: CollectionQuery["orderBy"] = [];

  for (const rawSegment of rawOrder.split(",")) {
    const segment = rawSegment.trim();
    if (!segment) {
      issues.push(createIssue(["order"], "Order entries must not be empty"));
      continue;
    }

    const [rawField, rawDirection, ...rest] = segment.split(".");
    if (!rawField || rest.length > 0) {
      issues.push(createIssue(["order"], `Invalid order entry '${segment}'`));
      continue;
    }

    let fieldReference;

    try {
      fieldReference = resolveRawCollectionField(definition, rawField);
    } catch {
      issues.push(createIssue(["order"], `Unknown order field '${rawField}'`));
      continue;
    }

    if (!fieldReference.fieldDefinition.sortable) {
      issues.push(createIssue(["order"], `Field '${rawField}' does not support sorting`));
      continue;
    }

    const parsedDirection = orderDirectionSchema.safeParse(rawDirection ?? "asc");
    if (!parsedDirection.success) {
      issues.push(createIssue(["order"], `Invalid sort direction for '${rawField}'`));
      continue;
    }

    orderBy.push({
      direction: parsedDirection.data,
      field: fieldReference.field,
      relationship: fieldReference.relationship,
    });
  }

  return orderBy;
}

function parseCollectionSearch(
  definition: CollectionQueryDefinition,
  rawSearch: string | undefined,
  issues: z.core.$ZodIssue[]
): { search?: string; searchBy: CollectionSearchField[] } {
  if (!rawSearch) {
    return { searchBy: [] };
  }

  const searchFields = definition.searchFields ?? [];
  if (searchFields.length === 0) {
    issues.push(createIssue(["search"], "Search is not supported for this collection"));
    return { search: rawSearch, searchBy: [] };
  }

  const searchBy: CollectionSearchField[] = [];

  for (const rawField of searchFields) {
    let fieldReference;

    try {
      fieldReference = resolveRawCollectionField(definition, rawField);
    } catch {
      issues.push(createIssue(["search"], `Unknown search field '${rawField}'`));
      continue;
    }

    if (fieldReference.fieldDefinition.kind !== "string") {
      issues.push(createIssue(["search"], `Field '${rawField}' does not support search`));
      continue;
    }

    searchBy.push({
      field: fieldReference.field,
      relationship: fieldReference.relationship,
    });
  }

  return {
    search: rawSearch,
    searchBy,
  };
}

function parseCollectionFilter(
  definition: CollectionQueryDefinition,
  rawField: string,
  rawValue: QueryValue,
  issues: z.core.$ZodIssue[]
): CollectionFilter | null {
  if (rawValue === undefined) {
    issues.push(createIssue([rawField], `Missing value for '${rawField}'`));
    return null;
  }

  if (Array.isArray(rawValue)) {
    issues.push(createIssue([rawField], `Repeated query parameters are not supported for '${rawField}'`));
    return null;
  }

  let fieldReference;

  try {
    fieldReference = resolveRawCollectionField(definition, rawField);
  } catch {
    issues.push(createIssue([rawField], `Unknown filter field '${rawField}'`));
    return null;
  }

  if (!fieldReference.fieldDefinition.filterable) {
    issues.push(createIssue([rawField], `Field '${rawField}' does not support filtering`));
    return null;
  }

  const separatorIndex = rawValue.indexOf(".");
  if (separatorIndex < 1) {
    issues.push(createIssue([rawField], `Filter '${rawField}' must use the '<operator>.<value>' format`));
    return null;
  }

  const rawOperator = rawValue.slice(0, separatorIndex);
  const parsedOperator = filterOperatorSchema.safeParse(rawOperator);
  if (!parsedOperator.success) {
    issues.push(createIssue([rawField], `Unsupported filter operator '${rawOperator}' for '${rawField}'`));
    return null;
  }

  const rawFilterValue = rawValue.slice(separatorIndex + 1);
  const value = parseFilterValue(rawField, fieldReference.fieldDefinition, parsedOperator.data, rawFilterValue, issues);
  if (value === null && parsedOperator.data !== "is") {
    return null;
  }

  return {
    field: fieldReference.field,
    relationship: fieldReference.relationship,
    operator: parsedOperator.data,
    value,
  };
}

function parseCollectionEmbeds(
  definition: CollectionQueryDefinition,
  rawEmbed: QueryValue,
  issues: z.core.$ZodIssue[]
): string[] {
  if (rawEmbed === undefined) {
    return [];
  }

  if (Array.isArray(rawEmbed)) {
    issues.push(createIssue(["embed"], "Repeated query parameters are not supported for 'embed'"));
    return [];
  }

  const embeds = new Set<string>();

  for (const rawSegment of rawEmbed.split(",")) {
    const segment = rawSegment.trim();
    if (!segment) {
      issues.push(createIssue(["embed"], "Embed entries must not be empty"));
      continue;
    }

    if (!definition.relationships?.[segment]) {
      issues.push(createIssue(["embed"], `Unknown embed '${segment}'`));
      continue;
    }

    embeds.add(segment);
  }

  return Array.from(embeds);
}

export function parseCollectionQuery(definition: CollectionQueryDefinition, rawInput: unknown): CollectionQuery {
  const parsedInput = collectionInputSchema.safeParse(rawInput ?? {});
  if (!parsedInput.success) {
    throw parsedInput.error;
  }

  const issues: z.core.$ZodIssue[] = [];
  const embeds = parseCollectionEmbeds(definition, parsedInput.data.embed, issues);
  const { search, searchBy } = parseCollectionSearch(definition, parsedInput.data.search, issues);
  const filters: CollectionFilter[] = [];
  const entries = Object.entries(parsedInput.data) as [string, QueryValue][];

  for (const [field, value] of entries) {
    if (reservedCollectionQueryParams.has(field)) {
      continue;
    }

    const filter = parseCollectionFilter(definition, field, value, issues);
    if (filter) {
      filters.push(filter);
    }
  }

  const orderBy = parseCollectionOrder(definition, parsedInput.data.order, issues);

  if (issues.length > 0) {
    throw new z.ZodError(issues);
  }

  return {
    embeds,
    filters,
    limit: parsedInput.data.limit,
    offset: parsedInput.data.offset,
    orderBy,
    search,
    searchBy,
  };
}

export function isCollectionQueryValidationError(error: unknown): error is z.ZodError {
  return error instanceof z.ZodError;
}

export function formatCollectionQueryValidationError(error: z.ZodError) {
  return z.prettifyError(error);
}
