import { eq } from "drizzle-orm";
import { dataset, datasetProject, project } from "@repo/database/schema";
import type { CollectionQueryDefinition } from "../../collection-query";
import { datasetQueryDefinition } from "../dataset/query-definition";
import { projectQueryDefinition } from "../project/query-definition";

export const datasetProjectQueryDefinition = {
  fields: {
    datasetId: { column: datasetProject.datasetId, filterable: true, kind: "uuid", sortable: true },
    id: { column: datasetProject.id, filterable: true, kind: "uuid", sortable: true },
    projectId: { column: datasetProject.projectId, filterable: true, kind: "uuid", sortable: true },
  },
  relationships: {
    dataset: {
      fields: datasetQueryDefinition.fields,
      join: eq(datasetProject.datasetId, dataset.id),
      table: dataset,
    },
    project: {
      fields: projectQueryDefinition.fields,
      join: eq(datasetProject.projectId, project.id),
      table: project,
    },
  },
  searchFields: ["dataset:name", "project:name", "project:slug"],
  table: datasetProject,
} satisfies CollectionQueryDefinition<typeof datasetProject>;
