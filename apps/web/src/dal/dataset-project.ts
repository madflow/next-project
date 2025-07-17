import "server-only";
import { eq } from "drizzle-orm";
import { dataset, datasetProject as entity, project, selectDatasetVariableSchema } from "@repo/database/schema";
import { withAdminCheck, withSessionCheck } from "@/lib/dal";
import { createListWithJoins } from "@/lib/dal-joins";

export const listByProject = withSessionCheck(
  createListWithJoins(entity, selectDatasetVariableSchema, [
    {
      table: project,
      condition: eq(entity.projectId, project.id),
    },
    {
      table: dataset,
      condition: eq(entity.datasetId, dataset.id),
    },
  ])
);

export const listByDataset = withAdminCheck(
  createListWithJoins(entity, selectDatasetVariableSchema, [
    {
      table: project,
      condition: eq(entity.projectId, project.id),
    },
    {
      table: dataset,
      condition: eq(entity.datasetId, dataset.id),
    },
  ])
);
