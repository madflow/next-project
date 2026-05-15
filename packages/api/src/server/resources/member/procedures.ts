import { ORPCError, implement } from "@orpc/server";
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
import { memberContract } from "../../../shared/contract/resources/member";
import { listCollection } from "../../collection-query";
import type { Context } from "../../context";
import { withIntegrityConstraintErrors } from "../../errors/integrity-constraint-error";
import { memberQueryDefinition } from "./query-definition";

const ms = implement(memberContract).$context<Context>();

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

export async function createMember(context: Pick<Context, "db">, input: CreateMemberData) {
  return withIntegrityConstraintErrors(async () => {
    const [member] = await context.db.insert(memberTable).values(input).returning();

    if (member === undefined) {
      throw new Error("Failed to create member");
    }

    return member;
  });
}

export async function updateMember(context: Pick<Context, "db">, input: UpdateMemberInput) {
  const { id } = input.params;
  const changes = input.body;

  return withIntegrityConstraintErrors(async () => {
    const [member] = await context.db.update(memberTable).set(changes).where(eq(memberTable.id, id)).returning();

    if (member === undefined) {
      throw new ORPCError("NOT_FOUND", {
        message: "Member not found",
        status: 404,
      });
    }

    return member;
  });
}

export async function listMembers(context: Pick<Context, "db">, input: unknown) {
  return listCollection<MemberListRow>({
    db: context.db,
    definition: memberQueryDefinition,
    embedSelections: {
      organization: getTableColumns(organization),
      user: getTableColumns(user),
    },
    input,
  });
}

export async function deleteMember(context: Pick<Context, "db">, input: { id: string }) {
  const [member] = await context.db.delete(memberTable).where(eq(memberTable.id, input.id)).returning();

  if (member === undefined) {
    throw new ORPCError("NOT_FOUND", {
      message: "Member not found",
      status: 404,
    });
  }

  return member;
}

const create = ms.create.handler(async ({ context, input }) => createMember(context, input));
const remove = ms.delete.handler(async ({ context, input }) => deleteMember(context, input));
const list = ms.list.handler(async ({ context, input }) => listMembers(context, input));
const update = ms.update.handler(async ({ context, input }) => updateMember(context, input));

export const member = {
  create,
  delete: remove,
  list,
  update,
};
