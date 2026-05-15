import { eq } from "drizzle-orm";
import { dataset, datasetVariable } from "@repo/database/schema";
import type { CollectionQueryDefinition } from "../../collection-query";
import { datasetQueryDefinition } from "../dataset/query-definition";

export const datasetVariableQueryDefinition = {
  fields: {
    createdAt: { column: datasetVariable.createdAt, filterable: true, kind: "date", sortable: true },
    datasetId: { column: datasetVariable.datasetId, filterable: true, kind: "uuid", sortable: true },
    id: { column: datasetVariable.id, filterable: true, kind: "uuid", sortable: true },
    label: { column: datasetVariable.label, filterable: true, kind: "string", sortable: true },
    measure: { column: datasetVariable.measure, filterable: true, kind: "string", sortable: true },
    missingRanges: { column: datasetVariable.missingRanges, filterable: false, kind: "json", sortable: false },
    missingValues: { column: datasetVariable.missingValues, filterable: false, kind: "json", sortable: false },
    name: { column: datasetVariable.name, filterable: true, kind: "string", sortable: true },
    type: { column: datasetVariable.type, filterable: true, kind: "string", sortable: true },
    valueLabels: { column: datasetVariable.valueLabels, filterable: false, kind: "json", sortable: false },
    variableLabels: { column: datasetVariable.variableLabels, filterable: false, kind: "json", sortable: false },
  },
  relationships: {
    dataset: {
      fields: datasetQueryDefinition.fields,
      join: eq(datasetVariable.datasetId, dataset.id),
      table: dataset,
    },
  },
  searchFields: ["name", "label"],
  table: datasetVariable,
} satisfies CollectionQueryDefinition<typeof datasetVariable>;
