import { getTableColumns } from "drizzle-orm";
import {
  type Dataset,
  type DatasetProject as DatasetProjectRecord,
  type Project,
  dataset,
  datasetProject as datasetProjectTable,
  project,
} from "@repo/database/schema";
import { authenticatedApi } from "../../base";
import { listCollection } from "../../collection-query";
import { getDatasetRelatedAccessWhere } from "../dataset/access";
import { datasetProjectQueryDefinition } from "./query-definition";

const authenticatedDatasetProjectApi = authenticatedApi.datasetProject;

type DatasetProjectListRow = DatasetProjectRecord & {
  dataset?: Dataset;
  project?: Project;
};

const list = authenticatedDatasetProjectApi.list.handler(async ({ context, input }) => {
  const accessWhere = getDatasetRelatedAccessWhere(context, datasetProjectTable.datasetId);

  return listCollection<DatasetProjectListRow>({
    db: context.db,
    definition: datasetProjectQueryDefinition,
    embedSelections: {
      dataset: getTableColumns(dataset),
      project: getTableColumns(project),
    },
    input,
    where: accessWhere,
  });
});

export const datasetProject = {
  list,
};
