import { oc } from "@orpc/contract";
import { selectDatasetSchema, selectOrganizationSchema } from "@repo/database/schema";
import { collectionInputSchema, createCollectionResultSchema } from "../collection";

const listDatasetRowSchema = selectDatasetSchema.extend({
  organization: selectOrganizationSchema.optional(),
});

const listDatasetResultSchema = createCollectionResultSchema(listDatasetRowSchema);

const listDatasetContract = oc.input(collectionInputSchema).output(listDatasetResultSchema).route({
  method: "GET",
  path: "/datasets",
});

export const datasetContract = {
  list: listDatasetContract,
};
