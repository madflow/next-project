import { dataset } from "./resources/dataset/procedures";
import { member } from "./resources/member/procedures";
import { organization } from "./resources/organization/procedures";
import { project } from "./resources/project/procedures";

export const appRouter = {
  dataset,
  member,
  organization,
  project,
};
