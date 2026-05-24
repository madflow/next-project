import { getTableColumns } from "drizzle-orm";
import {
  type Dataset,
  type DatasetVariable as DatasetVariableRecord,
  dataset,
  datasetVariable as datasetVariableTable,
} from "@repo/database/schema";
import { authenticatedApi } from "../../base";
import { listCollection } from "../../collection-query";
import { getDatasetRelatedAccessWhere } from "../dataset/access";
import { datasetVariableQueryDefinition } from "./query-definition";

const authenticatedDatasetVariableApi = authenticatedApi.datasetVariable;

type DatasetVariableListRow = DatasetVariableRecord & {
  dataset?: Dataset;
};

const list = authenticatedDatasetVariableApi.list.handler(async ({ context, input }) => {
  const accessWhere = getDatasetRelatedAccessWhere(context, datasetVariableTable.datasetId);

  return listCollection<DatasetVariableListRow>({
    db: context.db,
    definition: datasetVariableQueryDefinition,
    embedSelections: {
      dataset: getTableColumns(dataset),
    },
    input,
    where: accessWhere,
  });
});

export const datasetVariable = {
  list,
};
