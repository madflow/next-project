import { user } from "@repo/database/schema";
import type { CollectionQueryDefinition } from "../../collection-query";

export const userQueryDefinition = {
  fields: {
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
  },
  searchFields: ["name", "email"],
  table: user,
} satisfies CollectionQueryDefinition<typeof user>;
