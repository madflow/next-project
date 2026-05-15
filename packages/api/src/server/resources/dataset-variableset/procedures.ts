import { getTableColumns } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  type Dataset,
  type DatasetVariableset as DatasetVariablesetRecord,
  dataset,
  datasetVariableset as datasetVariablesetTable,
} from "@repo/database/schema";
import { authenticatedApi } from "../../base";
import { listCollection } from "../../collection-query";
import { getDatasetRelatedAccessWhere } from "../dataset/access";
import { datasetVariablesetQueryDefinition } from "./query-definition";

const authenticatedDatasetVariablesetApi = authenticatedApi.datasetVariableset;
const parentVariableset = alias(datasetVariablesetTable, "parent_dataset_variableset");

type DatasetVariablesetListRow = DatasetVariablesetRecord & {
  dataset?: Dataset;
  parent?: DatasetVariablesetRecord;
};

const list = authenticatedDatasetVariablesetApi.list.handler(async ({ context, input }) => {
  const accessWhere = getDatasetRelatedAccessWhere(context, datasetVariablesetTable.datasetId);

  return listCollection<DatasetVariablesetListRow>({
    db: context.db,
    definition: datasetVariablesetQueryDefinition,
    embedSelections: {
      dataset: getTableColumns(dataset),
      parent: getTableColumns(parentVariableset),
    },
    input,
    where: accessWhere,
  });
});

export const datasetVariableset = {
  list,
};
