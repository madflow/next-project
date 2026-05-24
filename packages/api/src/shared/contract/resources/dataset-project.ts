import { oc } from "@orpc/contract";
import { selectDatasetProjectSchema, selectDatasetSchema, selectProjectSchema } from "@repo/database/schema";
import { collectionInputSchema, createCollectionResultSchema } from "../collection";

const listDatasetProjectRowSchema = selectDatasetProjectSchema.extend({
  dataset: selectDatasetSchema.optional(),
  project: selectProjectSchema.optional(),
});

const listDatasetProjectResultSchema = createCollectionResultSchema(listDatasetProjectRowSchema);

const listDatasetProjectContract = oc.input(collectionInputSchema).output(listDatasetProjectResultSchema).route({
  method: "GET",
  path: "/dataset-projects",
});

export const datasetProjectContract = {
  list: listDatasetProjectContract,
};
