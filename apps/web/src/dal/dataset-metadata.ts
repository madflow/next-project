import "server-only";
import { eq } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import { datasetMetadataFile, selectDatasetMetadataFileSchema } from "@repo/database/schema";
import { ListOptions, createList, withSessionCheck } from "@/dal/dal";

const baseList = createList(datasetMetadataFile, selectDatasetMetadataFileSchema);

async function listByDatasetFn(datasetId: string, options: ListOptions = {}) {
  return baseList({
    ...options,
    filters: [...(options.filters ?? []), { column: "datasetId", operator: "eq", value: datasetId }],
    orderBy: options.orderBy?.length ? options.orderBy : [{ column: "createdAt", direction: "desc" }],
  });
}

async function findByIdFn(fileId: string) {
  return db.query.datasetMetadataFile.findFirst({
    where: eq(datasetMetadataFile.id, fileId),
  });
}

export const listByDataset = withSessionCheck(listByDatasetFn);
export const findById = withSessionCheck(findByIdFn);
