import { oc } from "@orpc/contract";
import { z } from "zod";
import { selectDatasetSchema, selectOrganizationSchema } from "@repo/database/schema";
import { collectionEmbedInputSchema, collectionInputSchema, createCollectionResultSchema } from "../collection";
import { listDatasetProjectResultSchema } from "./dataset-project";
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

const listDatasetProjectsContract = oc
  .input(datasetIdSchema.merge(collectionInputSchema))
  .output(listDatasetProjectResultSchema)
  .route({
    method: "GET",
    path: "/datasets/{id}/projects",
  });

export const datasetContract = {
  get: getDatasetContract,
  list: listDatasetContract,
  projects: {
    list: listDatasetProjectsContract,
  },
  variables: {
    list: listDatasetVariablesContract,
  },
};
