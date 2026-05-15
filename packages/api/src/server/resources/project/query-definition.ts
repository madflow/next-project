import { eq } from "drizzle-orm";
import { organization, project } from "@repo/database/schema";
import type { CollectionQueryDefinition } from "../../collection-query";
import { organizationQueryDefinition } from "../organization/query-definition";

export const projectQueryDefinition = {
  fields: {
    createdAt: { column: project.createdAt, filterable: true, kind: "date", sortable: true },
    id: { column: project.id, filterable: true, kind: "uuid", sortable: true },
    metadata: { column: project.metadata, filterable: false, kind: "json", sortable: false },
    name: { column: project.name, filterable: true, kind: "string", sortable: true },
    organizationId: { column: project.organizationId, filterable: true, kind: "uuid", sortable: true },
    slug: { column: project.slug, filterable: true, kind: "string", sortable: true },
    updatedAt: { column: project.updatedAt, filterable: true, kind: "date", sortable: true },
  },
  relationships: {
    organization: {
      fields: organizationQueryDefinition.fields,
      join: eq(project.organizationId, organization.id),
      table: organization,
    },
  },
  searchFields: ["name", "slug"],
  table: project,
} satisfies CollectionQueryDefinition<typeof project>;
