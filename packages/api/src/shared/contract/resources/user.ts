import { oc } from "@orpc/contract";
import { z } from "zod";
import { insertUserSchema, selectUserSchema, updateUserSchema } from "@repo/database/schema";
import { collectionInputSchema, createCollectionResultSchema } from "../collection";
import { emptyUpdateMessage, hasUpdateChanges } from "../update";

const listUserResultSchema = createCollectionResultSchema(selectUserSchema);
const userIdSchema = z.object({
  id: z.uuid(),
});

const listUserContract = oc.input(collectionInputSchema).output(listUserResultSchema).route({
  method: "GET",
  path: "/users",
});

const createUserContract = oc.input(insertUserSchema).output(selectUserSchema).route({
  method: "POST",
  path: "/users",
});

const updateUserBodySchema = updateUserSchema.omit({ id: true }).refine(hasUpdateChanges, {
  message: emptyUpdateMessage,
});

const updateUserContract = oc
  .input(
    z.object({
      body: updateUserBodySchema,
      params: userIdSchema,
    })
  )
  .output(selectUserSchema)
  .route({
    inputStructure: "detailed",
    method: "PUT",
    path: "/users/{id}",
  });

const deleteUserContract = oc.input(userIdSchema).output(selectUserSchema).route({
  method: "DELETE",
  path: "/users/{id}",
});

export const userContract = {
  create: createUserContract,
  delete: deleteUserContract,
  list: listUserContract,
  update: updateUserContract,
};
