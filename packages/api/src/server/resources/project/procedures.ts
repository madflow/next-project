import { ORPCError, implement } from "@orpc/server";
import { eq, getTableColumns } from "drizzle-orm";
import {
  type CreateProjectData,
  type Organization,
  type Project,
  type UpdateProjectData,
  organization,
  project as projectTable,
} from "@repo/database/schema";
import { projectContract } from "../../../shared/contract/resources/project";
import { listCollection } from "../../collection-query";
import type { Context } from "../../context";
import { withIntegrityConstraintErrors } from "../../errors/integrity-constraint-error";
import { projectQueryDefinition } from "./query-definition";

const ps = implement(projectContract).$context<Context>();

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
  return withIntegrityConstraintErrors(async () => {
    const [project] = await context.db.insert(projectTable).values(input).returning();

    if (project === undefined) {
      throw new Error("Failed to create project");
    }

    return project;
  });
}

export async function updateProject(context: Pick<Context, "db">, input: UpdateProjectInput) {
  const { id } = input.params;
  const changes = input.body;

  return withIntegrityConstraintErrors(async () => {
    const [project] = await context.db.update(projectTable).set(changes).where(eq(projectTable.id, id)).returning();

    if (project === undefined) {
      throw new ORPCError("NOT_FOUND", {
        message: "Project not found",
        status: 404,
      });
    }

    return project;
  });
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
  const [project] = await context.db.delete(projectTable).where(eq(projectTable.id, input.id)).returning();

  if (project === undefined) {
    throw new ORPCError("NOT_FOUND", {
      message: "Project not found",
      status: 404,
    });
  }

  return project;
}

const create = ps.create.handler(async ({ context, input }) => createProject(context, input));
const remove = ps.delete.handler(async ({ context, input }) => deleteProject(context, input));
const list = ps.list.handler(async ({ context, input }) => listProjects(context, input));
const update = ps.update.handler(async ({ context, input }) => updateProject(context, input));

export const project = {
  create,
  delete: remove,
  list,
  update,
};
