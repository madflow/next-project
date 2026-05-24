import { oc } from "@orpc/contract";
import { selectDatasetSchema, selectDatasetVariableSchema } from "@repo/database/schema";
import { collectionInputSchema, createCollectionResultSchema } from "../collection";

const listDatasetVariableRowSchema = selectDatasetVariableSchema.extend({
  dataset: selectDatasetSchema.optional(),
});

export const listDatasetVariableResultSchema = createCollectionResultSchema(listDatasetVariableRowSchema);

const listDatasetVariableContract = oc.input(collectionInputSchema).output(listDatasetVariableResultSchema).route({
  method: "GET",
  path: "/dataset-variables",
});

export const datasetVariableContract = {
  list: listDatasetVariableContract,
};
