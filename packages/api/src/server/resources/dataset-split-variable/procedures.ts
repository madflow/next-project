import { getTableColumns } from "drizzle-orm";
import {
  type Dataset,
  type DatasetSplitVariable as DatasetSplitVariableRecord,
  type DatasetVariable,
  dataset,
  datasetSplitVariable as datasetSplitVariableTable,
  datasetVariable,
} from "@repo/database/schema";
import { authenticatedApi } from "../../base";
import { listCollection } from "../../collection-query";
import { getDatasetRelatedAccessWhere } from "../dataset/access";
import { datasetSplitVariableQueryDefinition } from "./query-definition";

const authenticatedDatasetSplitVariableApi = authenticatedApi.datasetSplitVariable;

type DatasetSplitVariableListRow = DatasetSplitVariableRecord & {
  dataset?: Dataset;
  variable?: DatasetVariable;
};

const list = authenticatedDatasetSplitVariableApi.list.handler(async ({ context, input }) => {
  const accessWhere = getDatasetRelatedAccessWhere(context, datasetSplitVariableTable.datasetId);

  return listCollection<DatasetSplitVariableListRow>({
    db: context.db,
    definition: datasetSplitVariableQueryDefinition,
    embedSelections: {
      dataset: getTableColumns(dataset),
      variable: getTableColumns(datasetVariable),
    },
    input,
    where: accessWhere,
  });
});

export const datasetSplitVariable = {
  list,
};
