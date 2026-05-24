import { eq } from "drizzle-orm";
import { dataset, organization } from "@repo/database/schema";
import type { CollectionQueryDefinition } from "../../collection-query";
import { organizationQueryDefinition } from "../organization/query-definition";

export const datasetQueryDefinition = {
  fields: {
    createdAt: { column: dataset.createdAt, filterable: true, kind: "date", sortable: true },
    description: { column: dataset.description, filterable: true, kind: "string", sortable: true },
    fileHash: { column: dataset.fileHash, filterable: true, kind: "string", sortable: true },
    filename: { column: dataset.filename, filterable: true, kind: "string", sortable: true },
    fileSize: { column: dataset.fileSize, filterable: true, kind: "number", sortable: true },
    fileType: { column: dataset.fileType, filterable: true, kind: "string", sortable: true },
    id: { column: dataset.id, filterable: true, kind: "uuid", sortable: true },
    name: { column: dataset.name, filterable: true, kind: "string", sortable: true },
    organizationId: { column: dataset.organizationId, filterable: true, kind: "uuid", sortable: true },
    storageKey: { column: dataset.storageKey, filterable: true, kind: "string", sortable: true },
    updatedAt: { column: dataset.updatedAt, filterable: true, kind: "date", sortable: true },
    uploadedAt: { column: dataset.uploadedAt, filterable: true, kind: "date", sortable: true },
  },
  relationships: {
    organization: {
      fields: organizationQueryDefinition.fields,
      join: eq(dataset.organizationId, organization.id),
      table: organization,
    },
  },
  searchFields: ["name", "filename"],
  table: dataset,
} satisfies CollectionQueryDefinition<typeof dataset>;
