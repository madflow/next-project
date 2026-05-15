import { oc } from "@orpc/contract";
import { z } from "zod";
import {
  insertProjectSchema,
  selectOrganizationSchema,
  selectProjectSchema,
  updateProjectSchema,
} from "@repo/database/schema";
import { collectionInputSchema, createCollectionResultSchema } from "../collection";
import { emptyUpdateMessage, hasUpdateChanges } from "../update";

const listProjectRowSchema = selectProjectSchema.extend({
  organization: selectOrganizationSchema.optional(),
});

const listProjectResultSchema = createCollectionResultSchema(listProjectRowSchema);
const projectIdSchema = z.object({
  id: z.uuid(),
});

const listProjectContract = oc.input(collectionInputSchema).output(listProjectResultSchema).route({
  method: "GET",
  path: "/projects",
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
  list: listProjectContract,
  update: updateProjectContract,
};
