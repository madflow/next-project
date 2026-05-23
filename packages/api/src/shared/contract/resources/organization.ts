import { oc } from "@orpc/contract";
import { z } from "zod";
import { insertOrganizationSchema, selectOrganizationSchema, updateOrganizationSchema } from "@repo/database/schema";
import { collectionEmbedInputSchema, collectionInputSchema, createCollectionResultSchema } from "../collection";
import { emptyUpdateMessage, hasUpdateChanges } from "../update";

const listOrganizationResultSchema = createCollectionResultSchema(selectOrganizationSchema);
const organizationIdSchema = z.object({
  id: z.uuid(),
});

const listOrganizationContract = oc.input(collectionInputSchema).output(listOrganizationResultSchema).route({
  method: "GET",
  path: "/organizations",
});

const getOrganizationContract = oc
  .input(organizationIdSchema.merge(collectionEmbedInputSchema))
  .output(selectOrganizationSchema)
  .route({
    method: "GET",
    path: "/organizations/{id}",
  });

const createOrganizationContract = oc.input(insertOrganizationSchema).output(selectOrganizationSchema).route({
  method: "POST",
  path: "/organizations",
});

const updateOrganizationBodySchema = updateOrganizationSchema.omit({ id: true }).refine(hasUpdateChanges, {
  message: emptyUpdateMessage,
});

const updateOrganizationContract = oc
  .input(
    z.object({
      body: updateOrganizationBodySchema,
      params: organizationIdSchema,
    })
  )
  .output(selectOrganizationSchema)
  .route({
    inputStructure: "detailed",
    method: "PUT",
    path: "/organizations/{id}",
  });

const deleteOrganizationContract = oc.input(organizationIdSchema).output(selectOrganizationSchema).route({
  method: "DELETE",
  path: "/organizations/{id}",
});

export const organizationContract = {
  create: createOrganizationContract,
  delete: deleteOrganizationContract,
  get: getOrganizationContract,
  list: listOrganizationContract,
  update: updateOrganizationContract,
};
