import { ORPCError } from "@orpc/server";
import { eq, getTableColumns } from "drizzle-orm";
import {
  type CreateOrganizationData,
  type Organization,
  type Organization as OrganizationRecord,
  type Project,
  type UpdateOrganizationData,
  organization as organizationRelation,
  organization as organizationTable,
  project as projectTable,
} from "@repo/database/schema";
import { type CollectionInput, collectionInputSchema } from "../../../shared/contract/collection";
import { requireOrganizationMembership } from "../../auth/access";
import { type ProcedureContextInput, adminApi, authenticatedApi, call, toProcedureContext } from "../../base";
import { getCollectionRow, listCollection } from "../../collection-query";
import { projectQueryDefinition } from "../project/query-definition";
import { organizationQueryDefinition } from "./query-definition";

const os = adminApi.organization;
const authenticatedOrganizationApi = authenticatedApi.organization;

type UpdateOrganizationInput = {
  body: Omit<UpdateOrganizationData, "id">;
  params: {
    id: string;
  };
};

type OrganizationProjectsInput = CollectionInput & {
  id: string;
};

type OrganizationProjectListRow = Project & {
  organization?: Organization;
};

export async function createOrganization(context: ProcedureContextInput, input: CreateOrganizationData) {
  return call(create, input, { context: toProcedureContext(context) });
}

export async function updateOrganization(context: ProcedureContextInput, input: UpdateOrganizationInput) {
  return call(update, input, { context: toProcedureContext(context) });
}

export async function listOrganizations(context: ProcedureContextInput, input: CollectionInput) {
  return call(list, collectionInputSchema.parse(input), { context: toProcedureContext(context) });
}

export async function getOrganization(context: ProcedureContextInput, input: { embed?: string; id: string }) {
  return call(get, input, { context: toProcedureContext(context) });
}

export async function listOrganizationProjects(context: ProcedureContextInput, input: OrganizationProjectsInput) {
  return call(projectsList, input, { context: toProcedureContext(context) });
}

export async function deleteOrganization(context: ProcedureContextInput, input: { id: string }) {
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

const get = authenticatedOrganizationApi.get.handler(async ({ context, input }) => {
  const organization = await getCollectionRow<OrganizationRecord>({
    db: context.db,
    definition: organizationQueryDefinition,
    input,
    where: eq(organizationTable.id, input.id),
  });

  if (organization === undefined) {
    throw new ORPCError("NOT_FOUND", {
      message: "Organization not found",
      status: 404,
    });
  }

  await requireOrganizationMembership(context, organization.id);

  return organization;
});

const projectsList = authenticatedOrganizationApi.projects.list.handler(async ({ context, input }) => {
  await requireOrganizationMembership(context, input.id);
  const { id, ...collectionInput } = input;

  return listCollection<OrganizationProjectListRow>({
    db: context.db,
    definition: projectQueryDefinition,
    embedSelections: {
      organization: getTableColumns(organizationRelation),
    },
    input: collectionInput,
    where: eq(projectTable.organizationId, id),
  });
});

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
  get,
  list,
  projects: {
    list: projectsList,
  },
  update,
};
