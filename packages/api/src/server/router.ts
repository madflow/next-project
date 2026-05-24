import { currentuser } from "./resources/currentuser/procedures";
import { datasetProject } from "./resources/dataset-project/procedures";
import { datasetSplitVariable } from "./resources/dataset-split-variable/procedures";
import { datasetVariable } from "./resources/dataset-variable/procedures";
import { datasetVariableset } from "./resources/dataset-variableset/procedures";
import { dataset } from "./resources/dataset/procedures";
import { member } from "./resources/member/procedures";
import { organization } from "./resources/organization/procedures";
import { project } from "./resources/project/procedures";
import { user } from "./resources/user/procedures";

export const appRouter = {
  currentuser,
  dataset,
  datasetProject,
  datasetSplitVariable,
  datasetVariable,
  datasetVariableset,
  member,
  organization,
  project,
  user,
};
