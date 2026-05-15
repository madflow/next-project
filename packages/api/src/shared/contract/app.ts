import { oc } from "@orpc/contract";
import { appContractErrors } from "./errors";
import { memberContract } from "./resources/member";
import { organizationContract } from "./resources/organization";
import { projectContract } from "./resources/project";

export const appContract = oc.errors(appContractErrors).router({
  member: memberContract,
  organization: organizationContract,
  project: projectContract,
});
