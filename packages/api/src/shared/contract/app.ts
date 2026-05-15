import { oc } from "@orpc/contract";
import { appContractErrors } from "./errors";
import { currentuserContract } from "./resources/currentuser";
import { datasetContract } from "./resources/dataset";
import { datasetProjectContract } from "./resources/dataset-project";
import { datasetSplitVariableContract } from "./resources/dataset-split-variable";
import { datasetVariableContract } from "./resources/dataset-variable";
import { datasetVariablesetContract } from "./resources/dataset-variableset";
import { memberContract } from "./resources/member";
import { organizationContract } from "./resources/organization";
import { projectContract } from "./resources/project";
import { userContract } from "./resources/user";
import { variablesetContract } from "./resources/variableset";

export const appContract = oc.errors(appContractErrors).router({
  currentuser: currentuserContract,
  dataset: datasetContract,
  datasetProject: datasetProjectContract,
  datasetSplitVariable: datasetSplitVariableContract,
  datasetVariable: datasetVariableContract,
  datasetVariableset: datasetVariablesetContract,
  member: memberContract,
  organization: organizationContract,
  project: projectContract,
  user: userContract,
  variableset: variablesetContract,
});
