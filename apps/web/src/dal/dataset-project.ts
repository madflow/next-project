import "server-only";
import { eq } from "drizzle-orm";
import { dataset, datasetProject as entity, project, selectDatasetVariableSchema } from "@repo/database/schema";
import { ListOptions, createList, withSessionCheck } from "@/lib/dal";
import { createListWithJoins } from "@/lib/dal-joins";

const baseList = createList(entity, selectDatasetVariableSchema);

async function listByDatasetFn(datasetId: string, options: ListOptions = {}) {
  const listOptions: ListOptions = {
    ...options,
    filters: [...(options.filters || []), { column: "datasetId", operator: "eq", value: datasetId }],
  };
  return baseList(listOptions);
}

export const listByProject = withSessionCheck(
  createListWithJoins(entity, selectDatasetVariableSchema, [
    {
      table: project,
      condition: eq(entity.projectId, project.id),
    },
    {
      table: dataset,
      condition: eq(entity.datasetId, dataset.id),
    },
  ])
);

export const listByDataset = withSessionCheck(listByDatasetFn);
