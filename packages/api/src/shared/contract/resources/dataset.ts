import { oc } from "@orpc/contract";
import { z } from "zod";
import { selectDatasetSchema, selectOrganizationSchema } from "@repo/database/schema";
import { collectionEmbedInputSchema, collectionInputSchema, createCollectionResultSchema } from "../collection";
import { listDatasetVariableResultSchema } from "./dataset-variable";

const listDatasetRowSchema = selectDatasetSchema.extend({
  organization: selectOrganizationSchema.optional(),
});

const listDatasetResultSchema = createCollectionResultSchema(listDatasetRowSchema);
const datasetIdSchema = z.object({
  id: z.uuid(),
});

const listDatasetContract = oc.input(collectionInputSchema).output(listDatasetResultSchema).route({
  method: "GET",
  path: "/datasets",
});

const getDatasetContract = oc
  .input(datasetIdSchema.merge(collectionEmbedInputSchema))
  .output(listDatasetRowSchema)
  .route({
    method: "GET",
    path: "/datasets/{id}",
  });

const listDatasetVariablesContract = oc
  .input(datasetIdSchema.merge(collectionInputSchema))
  .output(listDatasetVariableResultSchema)
  .route({
    method: "GET",
    path: "/datasets/{id}/variables",
  });

export const datasetContract = {
  get: getDatasetContract,
  list: listDatasetContract,
  variables: {
    list: listDatasetVariablesContract,
  },
};
