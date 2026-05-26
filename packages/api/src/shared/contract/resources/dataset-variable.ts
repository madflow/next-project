import { oc } from "@orpc/contract";
import { z } from "zod";
import { selectDatasetSchema, selectDatasetVariableSchema } from "@repo/database/schema";
import { collectionInputSchema, createCollectionResultSchema } from "../collection";

const listDatasetVariableRowSchema = selectDatasetVariableSchema.extend({
  dataset: selectDatasetSchema.optional(),
});

export const listDatasetVariableResultSchema = createCollectionResultSchema(listDatasetVariableRowSchema);

const datasetVariableIdSchema = z.object({
  id: z.uuid(),
});

const listDatasetVariableContract = oc.input(collectionInputSchema).output(listDatasetVariableResultSchema).route({
  method: "GET",
  path: "/dataset-variables",
});

const getDatasetVariableContract = oc.input(datasetVariableIdSchema).output(selectDatasetVariableSchema).route({
  method: "GET",
  path: "/dataset-variables/{id}",
});

export const datasetVariableContract = {
  get: getDatasetVariableContract,
  list: listDatasetVariableContract,
};
