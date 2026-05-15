import {
  type CreateProjectData,
  type Organization,
  type Project,
  type UpdateProjectData,
  insertProjectSchema,
  selectProjectSchema,
  updateProjectSchema,
} from "@repo/database/schema";

export type ProjectWithOrganization = Project & {
  organization?: Organization;
};

export {
  insertProjectSchema,
  selectProjectSchema,
  updateProjectSchema,
  type CreateProjectData,
  type Project,
  type UpdateProjectData,
};
