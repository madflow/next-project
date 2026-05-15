import { ORPCError, implement } from "@orpc/server";
import { eq } from "drizzle-orm";
import {
  type CreateOrganizationData,
  type Organization as OrganizationRecord,
  type UpdateOrganizationData,
  organization as organizationTable,
} from "@repo/database/schema";
import { organizationContract } from "../../../shared/contract/resources/organization";
import { listCollection } from "../../collection-query";
import type { Context } from "../../context";
import { withIntegrityConstraintErrors } from "../../errors/integrity-constraint-error";
import { organizationQueryDefinition } from "./query-definition";

const os = implement(organizationContract).$context<Context>();

type UpdateOrganizationInput = {
  body: Omit<UpdateOrganizationData, "id">;
  params: {
    id: string;
  };
};

export async function createOrganization(context: Pick<Context, "db">, input: CreateOrganizationData) {
  return withIntegrityConstraintErrors(async () => {
    const [organization] = await context.db.insert(organizationTable).values(input).returning();

    if (organization === undefined) {
      throw new Error("Failed to create organization");
    }

    return organization;
  });
}

export async function updateOrganization(context: Pick<Context, "db">, input: UpdateOrganizationInput) {
  const { id } = input.params;
  const changes = input.body;

  return withIntegrityConstraintErrors(async () => {
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
}

export async function listOrganizations(context: Pick<Context, "db">, input: unknown) {
  return listCollection<OrganizationRecord>({
    db: context.db,
    definition: organizationQueryDefinition,
    input,
  });
}

export async function deleteOrganization(context: Pick<Context, "db">, input: { id: string }) {
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
}

const create = os.create.handler(async ({ context, input }) => createOrganization(context, input));
const remove = os.delete.handler(async ({ context, input }) => deleteOrganization(context, input));
const list = os.list.handler(async ({ context, input }) => listOrganizations(context, input));
const update = os.update.handler(async ({ context, input }) => updateOrganization(context, input));

export const organization = {
  create,
  delete: remove,
  list,
  update,
};
