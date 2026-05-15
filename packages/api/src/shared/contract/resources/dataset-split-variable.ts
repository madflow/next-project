import { oc } from "@orpc/contract";
import {
  selectDatasetSchema,
  selectDatasetSplitVariableSchema,
  selectDatasetVariableSchema,
} from "@repo/database/schema";
import { collectionInputSchema, createCollectionResultSchema } from "../collection";

const listDatasetSplitVariableRowSchema = selectDatasetSplitVariableSchema.extend({
  dataset: selectDatasetSchema.optional(),
  variable: selectDatasetVariableSchema.optional(),
});

export const listDatasetSplitVariableResultSchema = createCollectionResultSchema(listDatasetSplitVariableRowSchema);

const listDatasetSplitVariableContract = oc
  .input(collectionInputSchema)
  .output(listDatasetSplitVariableResultSchema)
  .route({
    method: "GET",
    path: "/dataset-split-variables",
  });

export const datasetSplitVariableContract = {
  list: listDatasetSplitVariableContract,
};
