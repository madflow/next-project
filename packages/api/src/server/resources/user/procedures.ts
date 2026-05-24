import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import {
  type CreateUserData,
  type UpdateUserData,
  type User as UserRecord,
  user as userTable,
} from "@repo/database/schema";
import { type CollectionInput, collectionInputSchema } from "../../../shared/contract/collection";
import { type ProcedureContextInput, adminApi, call, toProcedureContext } from "../../base";
import { getCollectionRow, listCollection } from "../../collection-query";
import { userQueryDefinition } from "./query-definition";

const us = adminApi.user;

type UpdateUserInput = {
  body: Omit<UpdateUserData, "id">;
  params: {
    id: string;
  };
};

export async function createUser(context: ProcedureContextInput, input: CreateUserData) {
  return call(create, input, { context: toProcedureContext(context) });
}

export async function updateUser(context: ProcedureContextInput, input: UpdateUserInput) {
  return call(update, input, { context: toProcedureContext(context) });
}

export async function listUsers(context: ProcedureContextInput, input: CollectionInput) {
  return call(list, collectionInputSchema.parse(input), { context: toProcedureContext(context) });
}

export async function getUser(context: ProcedureContextInput, input: { id: string }) {
  return call(get, input, { context: toProcedureContext(context) });
}

export async function deleteUser(context: ProcedureContextInput, input: { id: string }) {
  return call(remove, input, { context: toProcedureContext(context) });
}

const create = us.create.handler(async ({ context, input }) => {
  const [user] = await context.db.insert(userTable).values(input).returning();

  if (user === undefined) {
    throw new Error("Failed to create user");
  }

  return user;
});

const remove = us.delete.handler(async ({ context, input }) => {
  const [user] = await context.db.delete(userTable).where(eq(userTable.id, input.id)).returning();

  if (user === undefined) {
    throw new ORPCError("NOT_FOUND", {
      message: "User not found",
      status: 404,
    });
  }

  return user;
});

const list = us.list.handler(async ({ context, input }) =>
  listCollection<UserRecord>({
    db: context.db,
    definition: userQueryDefinition,
    input,
  })
);

const get = us.get.handler(async ({ context, input }) => {
  const user = await getCollectionRow<UserRecord>({
    db: context.db,
    definition: userQueryDefinition,
    input,
    where: eq(userTable.id, input.id),
  });

  if (user === undefined) {
    throw new ORPCError("NOT_FOUND", {
      message: "User not found",
      status: 404,
    });
  }

  return user;
});

const update = us.update.handler(async ({ context, input }) => {
  const { id } = input.params;
  const changes = input.body;

  const [user] = await context.db.update(userTable).set(changes).where(eq(userTable.id, id)).returning();

  if (user === undefined) {
    throw new ORPCError("NOT_FOUND", {
      message: "User not found",
      status: 404,
    });
  }

  return user;
});

export const user = {
  create,
  delete: remove,
  get,
  list,
  update,
};
