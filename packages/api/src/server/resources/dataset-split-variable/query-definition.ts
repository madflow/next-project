import { eq } from "drizzle-orm";
import { dataset, datasetSplitVariable, datasetVariable } from "@repo/database/schema";
import type { CollectionQueryDefinition } from "../../collection-query";
import { datasetVariableQueryDefinition } from "../dataset-variable/query-definition";
import { datasetQueryDefinition } from "../dataset/query-definition";

export const datasetSplitVariableQueryDefinition = {
  fields: {
    createdAt: { column: datasetSplitVariable.createdAt, filterable: true, kind: "date", sortable: true },
    datasetId: { column: datasetSplitVariable.datasetId, filterable: true, kind: "uuid", sortable: true },
    id: { column: datasetSplitVariable.id, filterable: true, kind: "uuid", sortable: true },
    variableId: { column: datasetSplitVariable.variableId, filterable: true, kind: "uuid", sortable: true },
  },
  relationships: {
    dataset: {
      fields: datasetQueryDefinition.fields,
      join: eq(datasetSplitVariable.datasetId, dataset.id),
      table: dataset,
    },
    variable: {
      fields: datasetVariableQueryDefinition.fields,
      join: eq(datasetSplitVariable.variableId, datasetVariable.id),
      table: datasetVariable,
    },
  },
  searchFields: ["dataset:name", "variable:name", "variable:label"],
  table: datasetSplitVariable,
} satisfies CollectionQueryDefinition<typeof datasetSplitVariable>;
