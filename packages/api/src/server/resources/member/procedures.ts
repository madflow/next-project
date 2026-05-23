import { ORPCError } from "@orpc/server";
import { eq, getTableColumns } from "drizzle-orm";
import {
  type CreateMemberData,
  type Member as MemberRecord,
  type Organization,
  type UpdateMemberData,
  type User,
  member as memberTable,
  organization,
  user,
} from "@repo/database/schema";
import { type CollectionInput, collectionInputSchema } from "../../../shared/contract/collection";
import { type ProcedureContextInput, adminApi, call, toProcedureContext } from "../../base";
import { listCollection } from "../../collection-query";
import { memberQueryDefinition } from "./query-definition";

const ms = adminApi.member;

type MemberListRow = MemberRecord & {
  organization?: Organization;
  user?: User;
};

type UpdateMemberInput = {
  body: Omit<UpdateMemberData, "id">;
  params: {
    id: string;
  };
};

export async function createMember(context: ProcedureContextInput, input: CreateMemberData) {
  return call(create, input, { context: toProcedureContext(context) });
}

export async function updateMember(context: ProcedureContextInput, input: UpdateMemberInput) {
  return call(update, input, { context: toProcedureContext(context) });
}

export async function listMembers(context: ProcedureContextInput, input: CollectionInput) {
  return call(list, collectionInputSchema.parse(input), { context: toProcedureContext(context) });
}

export async function deleteMember(context: ProcedureContextInput, input: { id: string }) {
  return call(remove, input, { context: toProcedureContext(context) });
}

const create = ms.create.handler(async ({ context, input }) => {
  const [member] = await context.db.insert(memberTable).values(input).returning();

  if (member === undefined) {
    throw new Error("Failed to create member");
  }

  return member;
});

const remove = ms.delete.handler(async ({ context, input }) => {
  const [member] = await context.db.delete(memberTable).where(eq(memberTable.id, input.id)).returning();

  if (member === undefined) {
    throw new ORPCError("NOT_FOUND", {
      message: "Member not found",
      status: 404,
    });
  }

  return member;
});

const list = ms.list.handler(async ({ context, input }) =>
  listCollection<MemberListRow>({
    db: context.db,
    definition: memberQueryDefinition,
    embedSelections: {
      organization: getTableColumns(organization),
      user: getTableColumns(user),
    },
    input,
  })
);

const update = ms.update.handler(async ({ context, input }) => {
  const { id } = input.params;
  const changes = input.body;

  const [member] = await context.db.update(memberTable).set(changes).where(eq(memberTable.id, id)).returning();

  if (member === undefined) {
    throw new ORPCError("NOT_FOUND", {
      message: "Member not found",
      status: 404,
    });
  }

  return member;
});

export const member = {
  create,
  delete: remove,
  list,
  update,
};
