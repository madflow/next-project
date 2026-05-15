import { organization } from "@repo/database/schema";
import type { CollectionQueryDefinition } from "../../collection-query";

export const organizationQueryDefinition = {
  fields: {
    createdAt: { column: organization.createdAt, filterable: true, kind: "date", sortable: true },
    id: { column: organization.id, filterable: true, kind: "uuid", sortable: true },
    logo: { column: organization.logo, filterable: true, kind: "string", sortable: true },
    metadata: { column: organization.metadata, filterable: true, kind: "string", sortable: true },
    name: { column: organization.name, filterable: true, kind: "string", sortable: true },
    settings: { column: organization.settings, filterable: false, kind: "json", sortable: false },
    slug: { column: organization.slug, filterable: true, kind: "string", sortable: true },
  },
  searchFields: ["name", "slug"],
  table: organization,
} satisfies CollectionQueryDefinition<typeof organization>;
