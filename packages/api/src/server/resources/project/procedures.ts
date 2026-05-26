import { ORPCError } from "@orpc/server";
import { and, eq, exists, getTableColumns, sql } from "drizzle-orm";
import {
  type CreateProjectData,
  type Dataset,
  type DatasetProject as DatasetProjectRecord,
  type Organization,
  type Project,
  type UpdateProjectData,
  dataset,
  datasetProject as datasetProjectTable,
  member,
  organization,
  project as projectTable,
} from "@repo/database/schema";
import { type CollectionInput, collectionInputSchema } from "../../../shared/contract/collection";
import { requireOrganizationMembership } from "../../auth/access";
import { type ProcedureContextInput, adminApi, authenticatedApi, call, toProcedureContext } from "../../base";
import { getCollectionRow, listCollection } from "../../collection-query";
import { datasetProjectQueryDefinition } from "../dataset-project/query-definition";
import { projectQueryDefinition } from "./query-definition";

const ps = adminApi.project;
const authenticatedProjectApi = authenticatedApi.project;

type ProjectListRow = Project & {
  organization?: Organization;
};

type UpdateProjectInput = {
  body: Omit<UpdateProjectData, "id">;
  params: {
    id: string;
  };
};

type ProjectDatasetsInput = CollectionInput & {
  id: string;
};

type ProjectDatasetListRow = DatasetProjectRecord & {
  dataset?: Dataset;
  project?: Project;
};

export async function createProject(context: ProcedureContextInput, input: CreateProjectData) {
  return call(create, input, { context: toProcedureContext(context) });
}

export async function updateProject(context: ProcedureContextInput, input: UpdateProjectInput) {
  return call(update, input, { context: toProcedureContext(context) });
}

export async function listProjects(context: ProcedureContextInput, input: CollectionInput) {
  return call(list, collectionInputSchema.parse(input), { context: toProcedureContext(context) });
}

export async function getProject(context: ProcedureContextInput, input: { embed?: string; id: string }) {
  return call(get, input, { context: toProcedureContext(context) });
}

export async function listProjectDatasets(context: ProcedureContextInput, input: ProjectDatasetsInput) {
  return call(datasetsList, input, { context: toProcedureContext(context) });
}

export async function deleteProject(context: ProcedureContextInput, input: { id: string }) {
  return call(remove, input, { context: toProcedureContext(context) });
}

const create = ps.create.handler(async ({ context, input }) => {
  const [project] = await context.db.insert(projectTable).values(input).returning();

  if (project === undefined) {
    throw new Error("Failed to create project");
  }

  return project;
});

const remove = ps.delete.handler(async ({ context, input }) => {
  const [project] = await context.db.delete(projectTable).where(eq(projectTable.id, input.id)).returning();

  if (project === undefined) {
    throw new ORPCError("NOT_FOUND", {
      message: "Project not found",
      status: 404,
    });
  }

  return project;
});

const list = authenticatedProjectApi.list.handler(async ({ context, input }) =>
  listCollection<ProjectListRow>({
    db: context.db,
    definition: projectQueryDefinition,
    embedSelections: {
      organization: getTableColumns(organization),
    },
    input,
    where: getProjectAccessWhere(context),
  })
);

const get = authenticatedProjectApi.get.handler(async ({ context, input }) => {
  const project = await getCollectionRow<ProjectListRow>({
    db: context.db,
    definition: projectQueryDefinition,
    embedSelections: {
      organization: getTableColumns(organization),
    },
    input,
    where: eq(projectTable.id, input.id),
  });

  if (project === undefined) {
    throw new ORPCError("NOT_FOUND", {
      message: "Project not found",
      status: 404,
    });
  }

  await requireOrganizationMembership(context, project.organizationId);

  return project;
});

const datasetsList = authenticatedProjectApi.datasets.list.handler(async ({ context, input }) => {
  const project = await getCollectionRow<Project>({
    db: context.db,
    definition: projectQueryDefinition,
    input: {},
    where: eq(projectTable.id, input.id),
  });

  if (project === undefined) {
    throw new ORPCError("NOT_FOUND", {
      message: "Project not found",
      status: 404,
    });
  }

  await requireOrganizationMembership(context, project.organizationId);

  const { id, ...collectionInput } = input;

  return listCollection<ProjectDatasetListRow>({
    db: context.db,
    definition: datasetProjectQueryDefinition,
    embedSelections: {
      dataset: getTableColumns(dataset),
      project: getTableColumns(projectTable),
    },
    input: collectionInput,
    where: eq(datasetProjectTable.projectId, id),
  });
});

const update = ps.update.handler(async ({ context, input }) => {
  const { id } = input.params;
  const changes = input.body;

  const [project] = await context.db.update(projectTable).set(changes).where(eq(projectTable.id, id)).returning();

  if (project === undefined) {
    throw new ORPCError("NOT_FOUND", {
      message: "Project not found",
      status: 404,
    });
  }

  return project;
});

export const project = {
  create,
  datasets: {
    list: datasetsList,
  },
  delete: remove,
  get,
  list,
  update,
};

function getProjectAccessWhere(context: ProcedureContextInput) {
  const procedureContext = toProcedureContext(context);

  if (procedureContext.principal.kind === "anonymous") {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Missing user session. Please log in!",
      status: 401,
    });
  }

  if (procedureContext.principal.user.role === "admin") {
    return undefined;
  }

  const membershipSubquery = context.db
    .select({ one: sql`1` })
    .from(member)
    .where(
      and(eq(member.organizationId, projectTable.organizationId), eq(member.userId, procedureContext.principal.user.id))
    );

  return exists(membershipSubquery);
}
