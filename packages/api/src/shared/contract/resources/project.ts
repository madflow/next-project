import { oc } from "@orpc/contract";
import { z } from "zod";
import {
  insertProjectSchema,
  selectOrganizationSchema,
  selectProjectSchema,
  updateProjectSchema,
} from "@repo/database/schema";
import { collectionEmbedInputSchema, collectionInputSchema, createCollectionResultSchema } from "../collection";
import { emptyUpdateMessage, hasUpdateChanges } from "../update";
import { listDatasetProjectResultSchema } from "./dataset-project";

const listProjectRowSchema = selectProjectSchema.extend({
  organization: selectOrganizationSchema.optional(),
});

export const listProjectResultSchema = createCollectionResultSchema(listProjectRowSchema);
const projectIdSchema = z.object({
  id: z.uuid(),
});

const listProjectContract = oc.input(collectionInputSchema).output(listProjectResultSchema).route({
  method: "GET",
  path: "/projects",
});

const getProjectContract = oc
  .input(projectIdSchema.merge(collectionEmbedInputSchema))
  .output(listProjectRowSchema)
  .route({
    method: "GET",
    path: "/projects/{id}",
  });

const listProjectDatasetsContract = oc
  .input(projectIdSchema.merge(collectionInputSchema))
  .output(listDatasetProjectResultSchema)
  .route({
    method: "GET",
    path: "/projects/{id}/datasets",
  });

const createProjectContract = oc.input(insertProjectSchema).output(selectProjectSchema).route({
  method: "POST",
  path: "/projects",
});

const updateProjectBodySchema = updateProjectSchema.omit({ id: true }).refine(hasUpdateChanges, {
  message: emptyUpdateMessage,
});

const updateProjectContract = oc
  .input(
    z.object({
      body: updateProjectBodySchema,
      params: projectIdSchema,
    })
  )
  .output(selectProjectSchema)
  .route({
    inputStructure: "detailed",
    method: "PUT",
    path: "/projects/{id}",
  });

const deleteProjectContract = oc.input(projectIdSchema).output(selectProjectSchema).route({
  method: "DELETE",
  path: "/projects/{id}",
});

export const projectContract = {
  create: createProjectContract,
  delete: deleteProjectContract,
  datasets: {
    list: listProjectDatasetsContract,
  },
  get: getProjectContract,
  list: listProjectContract,
  update: updateProjectContract,
};
