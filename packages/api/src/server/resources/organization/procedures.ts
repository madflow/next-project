import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import {
  type CreateOrganizationData,
  type Organization as OrganizationRecord,
  type UpdateOrganizationData,
  organization as organizationTable,
} from "@repo/database/schema";
import { api, call, toProcedureContext } from "../../base";
import { listCollection } from "../../collection-query";
import type { Context } from "../../context";
import { organizationQueryDefinition } from "./query-definition";

const os = api.organization;

type UpdateOrganizationInput = {
  body: Omit<UpdateOrganizationData, "id">;
  params: {
    id: string;
  };
};

export async function createOrganization(context: Pick<Context, "db">, input: CreateOrganizationData) {
  return call(create, input, { context: toProcedureContext(context) });
}

export async function updateOrganization(context: Pick<Context, "db">, input: UpdateOrganizationInput) {
  return call(update, input, { context: toProcedureContext(context) });
}

export async function listOrganizations(context: Pick<Context, "db">, input: unknown) {
  return listCollection<OrganizationRecord>({
    db: context.db,
    definition: organizationQueryDefinition,
    input,
  });
}

export async function deleteOrganization(context: Pick<Context, "db">, input: { id: string }) {
  return call(remove, input, { context: toProcedureContext(context) });
}

const create = os.create.handler(async ({ context, input }) => {
  const [organization] = await context.db.insert(organizationTable).values(input).returning();

  if (organization === undefined) {
    throw new Error("Failed to create organization");
  }

  return organization;
});

const remove = os.delete.handler(async ({ context, input }) => {
  const [organization] = await context.db
    .delete(organizationTable)
    .where(eq(organizationTable.id, input.id))
    .returning();

  if (organization === undefined) {
    throw new ORPCError("NOT_FOUND", {
      message: "Organization not found",
      status: 404,
    });
  }

  return organization;
});

const list = os.list.handler(async ({ context, input }) =>
  listCollection<OrganizationRecord>({
    db: context.db,
    definition: organizationQueryDefinition,
    input,
  })
);

const update = os.update.handler(async ({ context, input }) => {
  const { id } = input.params;
  const changes = input.body;

  const [organization] = await context.db
    .update(organizationTable)
    .set(changes)
    .where(eq(organizationTable.id, id))
    .returning();

  if (organization === undefined) {
    throw new ORPCError("NOT_FOUND", {
      message: "Organization not found",
      status: 404,
    });
  }

  return organization;
});

export const organization = {
  create,
  delete: remove,
  list,
  update,
};
