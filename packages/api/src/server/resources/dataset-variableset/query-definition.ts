import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { dataset, datasetVariableset } from "@repo/database/schema";
import type { CollectionQueryDefinition } from "../../collection-query";
import { datasetQueryDefinition } from "../dataset/query-definition";

const parentVariableset = alias(datasetVariableset, "parent_dataset_variableset");

export const datasetVariablesetQueryDefinition = {
  fields: {
    attributes: { column: datasetVariableset.attributes, filterable: false, kind: "json", sortable: false },
    category: { column: datasetVariableset.category, filterable: true, kind: "string", sortable: true },
    createdAt: { column: datasetVariableset.createdAt, filterable: true, kind: "date", sortable: true },
    datasetId: { column: datasetVariableset.datasetId, filterable: true, kind: "uuid", sortable: true },
    description: { column: datasetVariableset.description, filterable: true, kind: "string", sortable: true },
    id: { column: datasetVariableset.id, filterable: true, kind: "uuid", sortable: true },
    name: { column: datasetVariableset.name, filterable: true, kind: "string", sortable: true },
    orderIndex: { column: datasetVariableset.orderIndex, filterable: true, kind: "number", sortable: true },
    parentId: { column: datasetVariableset.parentId, filterable: true, kind: "uuid", sortable: true },
    updatedAt: { column: datasetVariableset.updatedAt, filterable: true, kind: "date", sortable: true },
  },
  relationships: {
    dataset: {
      fields: datasetQueryDefinition.fields,
      join: eq(datasetVariableset.datasetId, dataset.id),
      table: dataset,
    },
    parent: {
      fields: {
        attributes: { column: parentVariableset.attributes, filterable: false, kind: "json", sortable: false },
        category: { column: parentVariableset.category, filterable: true, kind: "string", sortable: true },
        createdAt: { column: parentVariableset.createdAt, filterable: true, kind: "date", sortable: true },
        datasetId: { column: parentVariableset.datasetId, filterable: true, kind: "uuid", sortable: true },
        description: { column: parentVariableset.description, filterable: true, kind: "string", sortable: true },
        id: { column: parentVariableset.id, filterable: true, kind: "uuid", sortable: true },
        name: { column: parentVariableset.name, filterable: true, kind: "string", sortable: true },
        orderIndex: { column: parentVariableset.orderIndex, filterable: true, kind: "number", sortable: true },
        parentId: { column: parentVariableset.parentId, filterable: true, kind: "uuid", sortable: true },
        updatedAt: { column: parentVariableset.updatedAt, filterable: true, kind: "date", sortable: true },
      },
      join: eq(datasetVariableset.parentId, parentVariableset.id),
      table: parentVariableset,
    },
  },
  searchFields: ["name", "description"],
  table: datasetVariableset,
} satisfies CollectionQueryDefinition<typeof datasetVariableset>;
