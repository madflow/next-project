import { oc } from "@orpc/contract";
import { z } from "zod";
import {
  insertMemberSchema,
  selectMemberSchema,
  selectOrganizationSchema,
  selectUserSchema,
  updateMemberSchema,
} from "@repo/database/schema";
import { collectionInputSchema, createCollectionResultSchema } from "../collection";
import { emptyUpdateMessage, hasUpdateChanges } from "../update";

const listMemberRowSchema = selectMemberSchema.extend({
  organization: selectOrganizationSchema.optional(),
  user: selectUserSchema.optional(),
});

const listMemberResultSchema = createCollectionResultSchema(listMemberRowSchema);
const memberIdSchema = z.object({
  id: z.uuid(),
});

const listMemberContract = oc.input(collectionInputSchema).output(listMemberResultSchema).route({
  method: "GET",
  path: "/members",
});

const createMemberContract = oc.input(insertMemberSchema).output(selectMemberSchema).route({
  method: "POST",
  path: "/members",
});

const updateMemberBodySchema = updateMemberSchema.omit({ id: true }).refine(hasUpdateChanges, {
  message: emptyUpdateMessage,
});

const updateMemberContract = oc
  .input(
    z.object({
      body: updateMemberBodySchema,
      params: memberIdSchema,
    })
  )
  .output(selectMemberSchema)
  .route({
    inputStructure: "detailed",
    method: "PUT",
    path: "/members/{id}",
  });

const deleteMemberContract = oc.input(memberIdSchema).output(selectMemberSchema).route({
  method: "DELETE",
  path: "/members/{id}",
});

export const memberContract = {
  create: createMemberContract,
  delete: deleteMemberContract,
  list: listMemberContract,
  update: updateMemberContract,
};
