import "server-only";
import { datasetProject as entity, selectDatasetVariableSchema } from "@repo/database/schema";
import { ListOptions, createList, withSessionCheck } from "@/lib/dal";

const baseList = createList(entity, selectDatasetVariableSchema);

async function listByDatasetFn(datasetId: string, options: ListOptions = {}) {
  const listOptions: ListOptions = {
    ...options,
    filters: [...(options.filters || []), { column: "datasetId", operator: "eq", value: datasetId }],
  };
  return baseList(listOptions);
}

export const listByDataset = withSessionCheck(listByDatasetFn);
