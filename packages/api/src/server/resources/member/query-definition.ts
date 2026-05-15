import { eq } from "drizzle-orm";
import { member, organization, user } from "@repo/database/schema";
import type { CollectionQueryDefinition } from "../../collection-query";
import { organizationQueryDefinition } from "../organization/query-definition";

const userFieldDefinitions = {
  banExpires: { column: user.banExpires, filterable: true, kind: "date", sortable: true },
  banReason: { column: user.banReason, filterable: true, kind: "string", sortable: true },
  banned: { column: user.banned, filterable: true, kind: "boolean", sortable: true },
  createdAt: { column: user.createdAt, filterable: true, kind: "date", sortable: true },
  email: { column: user.email, filterable: true, kind: "string", sortable: true },
  emailVerified: { column: user.emailVerified, filterable: true, kind: "boolean", sortable: true },
  id: { column: user.id, filterable: true, kind: "uuid", sortable: true },
  image: { column: user.image, filterable: true, kind: "string", sortable: true },
  locale: { column: user.locale, filterable: true, kind: "string", sortable: true },
  name: { column: user.name, filterable: true, kind: "string", sortable: true },
  role: { column: user.role, filterable: true, kind: "string", sortable: true },
  updatedAt: { column: user.updatedAt, filterable: true, kind: "date", sortable: true },
} as const;

export const memberQueryDefinition = {
  fields: {
    createdAt: { column: member.createdAt, filterable: true, kind: "date", sortable: true },
    id: { column: member.id, filterable: true, kind: "uuid", sortable: true },
    organizationId: { column: member.organizationId, filterable: true, kind: "uuid", sortable: true },
    role: { column: member.role, filterable: true, kind: "string", sortable: true },
    userId: { column: member.userId, filterable: true, kind: "uuid", sortable: true },
  },
  relationships: {
    organization: {
      fields: organizationQueryDefinition.fields,
      join: eq(member.organizationId, organization.id),
      table: organization,
    },
    user: {
      fields: userFieldDefinitions,
      join: eq(member.userId, user.id),
      table: user,
    },
  },
  searchFields: ["user:name", "user:email"],
  table: member,
} satisfies CollectionQueryDefinition<typeof member>;
