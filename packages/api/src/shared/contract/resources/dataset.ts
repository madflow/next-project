import { oc } from "@orpc/contract";
import { z } from "zod";
import { selectDatasetSchema, selectOrganizationSchema } from "@repo/database/schema";
import { collectionEmbedInputSchema, collectionInputSchema, createCollectionResultSchema } from "../collection";
import { listDatasetProjectResultSchema } from "./dataset-project";
import { listDatasetSplitVariableResultSchema } from "./dataset-split-variable";
import { listDatasetVariableResultSchema } from "./dataset-variable";
import { datasetVariablesetHierarchyResultSchema, listDatasetVariablesetResultSchema } from "./dataset-variableset";

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

const listDatasetAvailableSplitVariablesContract = oc
  .input(datasetIdSchema.merge(collectionInputSchema))
  .output(listDatasetVariableResultSchema)
  .route({
    method: "GET",
    path: "/datasets/{id}/variables/available-for-split",
  });

const listDatasetProjectsContract = oc
  .input(datasetIdSchema.merge(collectionInputSchema))
  .output(listDatasetProjectResultSchema)
  .route({
    method: "GET",
    path: "/datasets/{id}/projects",
  });

const listDatasetSplitVariablesContract = oc
  .input(datasetIdSchema.merge(collectionInputSchema))
  .output(listDatasetSplitVariableResultSchema)
  .route({
    method: "GET",
    path: "/datasets/{id}/splitvariables",
  });

const datasetVariablesetsListInputSchema = datasetIdSchema.merge(
  collectionInputSchema.extend({
    hierarchical: z.string().optional(),
    limit: z.coerce.number().int().min(1).default(10),
  })
);

const listDatasetVariablesetsContract = oc
  .input(datasetVariablesetsListInputSchema)
  .output(z.union([listDatasetVariablesetResultSchema, datasetVariablesetHierarchyResultSchema]))
  .route({
    method: "GET",
    path: "/datasets/{id}/variablesets",
  });

export const datasetContract = {
  get: getDatasetContract,
  list: listDatasetContract,
  projects: {
    list: listDatasetProjectsContract,
  },
  splitVariables: {
    list: listDatasetSplitVariablesContract,
  },
  variablesets: {
    list: listDatasetVariablesetsContract,
  },
  variables: {
    availableForSplit: listDatasetAvailableSplitVariablesContract,
    list: listDatasetVariablesContract,
  },
};
