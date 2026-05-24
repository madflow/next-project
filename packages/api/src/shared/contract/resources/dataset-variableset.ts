import { oc } from "@orpc/contract";
import { selectDatasetSchema, selectDatasetVariablesetSchema } from "@repo/database/schema";
import { collectionInputSchema, createCollectionResultSchema } from "../collection";

const listDatasetVariablesetRowSchema = selectDatasetVariablesetSchema.extend({
  dataset: selectDatasetSchema.optional(),
  parent: selectDatasetVariablesetSchema.optional(),
});

const listDatasetVariablesetResultSchema = createCollectionResultSchema(listDatasetVariablesetRowSchema);

const listDatasetVariablesetContract = oc
  .input(collectionInputSchema)
  .output(listDatasetVariablesetResultSchema)
  .route({
    method: "GET",
    path: "/dataset-variablesets",
  });

export const datasetVariablesetContract = {
  list: listDatasetVariablesetContract,
};
