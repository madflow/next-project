import { relations } from "drizzle-orm";
import {
  dataset,
  datasetProject,
  datasetSplitVariable,
  datasetVariable,
  datasetVariableset,
  datasetVariablesetItem,
  project,
} from "./app.js";
import { account, invitation, member, organization, session, user } from "./auth.js";

// User relations
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  memberships: many(member),
  sentInvitations: many(invitation),
}));

// Session relations
export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

// Account relations
export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// Organization relations
export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
  projects: many(project),
  datasets: many(dataset),
}));

// Member relations
export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

// Invitation relations
export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  inviter: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

// Project relations
export const projectRelations = relations(project, ({ one, many }) => ({
  organization: one(organization, {
    fields: [project.organizationId],
    references: [organization.id],
  }),
  datasetProjects: many(datasetProject),
}));

// Dataset relations
export const datasetRelations = relations(dataset, ({ one, many }) => ({
  organization: one(organization, {
    fields: [dataset.organizationId],
    references: [organization.id],
  }),
  variables: many(datasetVariable),
  variablesets: many(datasetVariableset),
  datasetProjects: many(datasetProject),
  splitVariables: many(datasetSplitVariable),
}));

// DatasetVariable relations
export const datasetVariableRelations = relations(datasetVariable, ({ one, many }) => ({
  dataset: one(dataset, {
    fields: [datasetVariable.datasetId],
    references: [dataset.id],
  }),
  variablesetItems: many(datasetVariablesetItem),
  splitVariableUsages: many(datasetSplitVariable),
}));

// DatasetProject relations
export const datasetProjectRelations = relations(datasetProject, ({ one }) => ({
  project: one(project, {
    fields: [datasetProject.projectId],
    references: [project.id],
  }),
  dataset: one(dataset, {
    fields: [datasetProject.datasetId],
    references: [dataset.id],
  }),
}));

// DatasetVariableset relations
export const datasetVariablesetRelations = relations(datasetVariableset, ({ one, many }) => ({
  dataset: one(dataset, {
    fields: [datasetVariableset.datasetId],
    references: [dataset.id],
  }),
  parent: one(datasetVariableset, {
    fields: [datasetVariableset.parentId],
    references: [datasetVariableset.id],
  }),
  children: many(datasetVariableset),
  items: many(datasetVariablesetItem),
}));

// DatasetVariablesetItem relations
export const datasetVariablesetItemRelations = relations(datasetVariablesetItem, ({ one }) => ({
  variableset: one(datasetVariableset, {
    fields: [datasetVariablesetItem.variablesetId],
    references: [datasetVariableset.id],
  }),
  variable: one(datasetVariable, {
    fields: [datasetVariablesetItem.variableId],
    references: [datasetVariable.id],
  }),
}));

// DatasetSplitVariable relations
export const datasetSplitVariableRelations = relations(datasetSplitVariable, ({ one }) => ({
  dataset: one(dataset, {
    fields: [datasetSplitVariable.datasetId],
    references: [dataset.id],
  }),
  variable: one(datasetVariable, {
    fields: [datasetSplitVariable.variableId],
    references: [datasetVariable.id],
  }),
}));
