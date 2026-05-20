import { ORPCError } from "@orpc/server";
import { eq, getTableColumns } from "drizzle-orm";
import {
  type CreateProjectData,
  type Organization,
  type Project,
  type UpdateProjectData,
  organization,
  project as projectTable,
} from "@repo/database/schema";
import { api, call, toProcedureContext } from "../../base";
import { listCollection } from "../../collection-query";
import type { Context } from "../../context";
import { projectQueryDefinition } from "./query-definition";

const ps = api.project;

type ProjectListRow = Project & {
  organization?: Organization;
};

type UpdateProjectInput = {
  body: Omit<UpdateProjectData, "id">;
  params: {
    id: string;
  };
};

export async function createProject(context: Pick<Context, "db">, input: CreateProjectData) {
  return call(create, input, { context: toProcedureContext(context) });
}

export async function updateProject(context: Pick<Context, "db">, input: UpdateProjectInput) {
  return call(update, input, { context: toProcedureContext(context) });
}

export async function listProjects(context: Pick<Context, "db">, input: unknown) {
  return listCollection<ProjectListRow>({
    db: context.db,
    definition: projectQueryDefinition,
    embedSelections: {
      organization: getTableColumns(organization),
    },
    input,
  });
}

export async function deleteProject(context: Pick<Context, "db">, input: { id: string }) {
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

const list = ps.list.handler(async ({ context, input }) =>
  listCollection<ProjectListRow>({
    db: context.db,
    definition: projectQueryDefinition,
    embedSelections: {
      organization: getTableColumns(organization),
    },
    input,
  })
);

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
  delete: remove,
  list,
  update,
};
