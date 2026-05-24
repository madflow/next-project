import { oc } from "@orpc/contract";
import { appContractErrors } from "./errors";
import { datasetContract } from "./resources/dataset";
import { memberContract } from "./resources/member";
import { organizationContract } from "./resources/organization";
import { projectContract } from "./resources/project";

export const appContract = oc.errors(appContractErrors).router({
  dataset: datasetContract,
  member: memberContract,
  organization: organizationContract,
  project: projectContract,
});
