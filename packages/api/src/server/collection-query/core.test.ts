import { eq } from "drizzle-orm";
import { QueryBuilder, boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  type CollectionQueryDefinition,
  compileDrizzleCollectionOrderBy,
  compileDrizzleCollectionWhere,
  parseCollectionQuery,
} from ".";

const organizations = pgTable("organizations", {
  active: boolean("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  id: uuid("id").notNull(),
  name: text("name").notNull(),
  settings: text("settings"),
  slug: text("slug").notNull(),
});

const projects = pgTable("projects", {
  id: uuid("id").notNull(),
  name: text("name").notNull(),
  organizationId: uuid("organization_id").notNull(),
});

const organizationQueryDefinition = {
  fields: {
    active: { column: organizations.active, filterable: true, kind: "boolean", sortable: true },
    createdAt: { column: organizations.createdAt, filterable: true, kind: "date", sortable: true },
    id: { column: organizations.id, filterable: true, kind: "uuid", sortable: true },
    name: { column: organizations.name, filterable: true, kind: "string", sortable: true },
    settings: { column: organizations.settings, filterable: false, kind: "json", sortable: false },
    slug: { column: organizations.slug, filterable: true, kind: "string", sortable: true },
  },
  searchFields: ["name", "slug"],
  table: organizations,
} satisfies CollectionQueryDefinition<typeof organizations>;

const projectQueryDefinition = {
  fields: {
    id: { column: projects.id, filterable: true, kind: "uuid", sortable: true },
    name: { column: projects.name, filterable: true, kind: "string", sortable: true },
  },
  relationships: {
    organization: {
      fields: organizationQueryDefinition.fields,
      join: eq(projects.organizationId, organizations.id),
      table: organizations,
    },
  },
  searchFields: ["name", "organization:name"],
  table: projects,
} satisfies CollectionQueryDefinition<typeof projects>;

describe("parseCollectionQuery", () => {
  test("parses scalar filters, order, and pagination", () => {
    const query = parseCollectionQuery(organizationQueryDefinition, {
      active: "eq.true",
      limit: "25",
      name: "ilike.*acme*",
      offset: "5",
      order: "name.asc,createdAt.desc",
    });

    assert.equal(query.limit, 25);
    assert.equal(query.offset, 5);
    assert.deepEqual(query.filters, [
      { field: "active", operator: "eq", relationship: undefined, value: true },
      { field: "name", operator: "ilike", relationship: undefined, value: "*acme*" },
    ]);
    assert.deepEqual(query.orderBy, [
      { direction: "asc", field: "name", relationship: undefined },
      { direction: "desc", field: "createdAt", relationship: undefined },
    ]);
    assert.deepEqual(query.searchBy, []);
  });

  test("parses configured search fields", () => {
    const query = parseCollectionQuery(organizationQueryDefinition, {
      search: "acme",
    });

    assert.equal(query.search, "acme");
    assert.deepEqual(query.searchBy, [
      { field: "name", relationship: undefined },
      { field: "slug", relationship: undefined },
    ]);
  });

  test("rejects unknown and unsupported filters", () => {
    assert.throws(
      () =>
        parseCollectionQuery(organizationQueryDefinition, {
          missing: "eq.value",
          settings: "eq.value",
        }),
      (error: unknown) => {
        const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
        return (
          message.includes("Unknown filter field 'missing'") &&
          message.includes("Field 'settings' does not support filtering")
        );
      }
    );
  });

  test("rejects invalid operator for field kind", () => {
    assert.throws(
      () => parseCollectionQuery(organizationQueryDefinition, { createdAt: "ilike.*2024*" }),
      (error: unknown) => {
        const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
        return message.includes("Operator 'ilike' is not supported");
      }
    );
  });

  test("parses embeds and relationship filters", () => {
    const query = parseCollectionQuery(projectQueryDefinition, {
      embed: "organization",
      "organization:name": "eq.Acme",
      order: "organization:name.asc,name.desc",
    });

    assert.deepEqual(query.embeds, ["organization"]);
    assert.deepEqual(query.filters, [{ field: "name", operator: "eq", relationship: "organization", value: "Acme" }]);
    assert.deepEqual(query.orderBy, [
      { direction: "asc", field: "name", relationship: "organization" },
      { direction: "desc", field: "name", relationship: undefined },
    ]);
  });

  test("parses relationship search fields", () => {
    const query = parseCollectionQuery(projectQueryDefinition, {
      search: "acme",
    });

    assert.equal(query.search, "acme");
    assert.deepEqual(query.searchBy, [
      { field: "name", relationship: undefined },
      { field: "name", relationship: "organization" },
    ]);
  });

  test("rejects invalid search field definitions", () => {
    const invalidDefinition = {
      fields: organizationQueryDefinition.fields,
      searchFields: ["settings", "owner:name"],
      table: organizations,
    } satisfies CollectionQueryDefinition<typeof organizations>;

    assert.throws(
      () => parseCollectionQuery(invalidDefinition, { search: "acme" }),
      (error: unknown) => {
        const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
        return (
          message.includes("Field 'settings' does not support search") &&
          message.includes("Unknown search field 'owner:name'")
        );
      }
    );
  });

  test("rejects unknown embeds", () => {
    assert.throws(
      () => parseCollectionQuery(projectQueryDefinition, { embed: "owner" }),
      (error: unknown) => {
        const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
        return message.includes("Unknown embed 'owner'");
      }
    );
  });
});

describe("compileDrizzleCollectionWhere", () => {
  test("translates filters and ordering to SQL", () => {
    const collectionQuery = parseCollectionQuery(organizationQueryDefinition, {
      active: "eq.true",
      name: "ilike.*acme*",
      order: "createdAt.desc",
    });

    const qb = new QueryBuilder();
    const query = qb
      .select()
      .from(organizations)
      .where(compileDrizzleCollectionWhere(organizationQueryDefinition, collectionQuery))
      .orderBy(...compileDrizzleCollectionOrderBy(organizationQueryDefinition, collectionQuery))
      .limit(collectionQuery.limit)
      .offset(collectionQuery.offset);

    const { params, sql } = query.toSQL();

    assert.match(sql, /ilike/);
    assert.match(sql, /order by/);
    assert.deepEqual(params.slice(0, 2), [true, "%acme%"]);
  });

  test("translates search into an OR group", () => {
    const collectionQuery = parseCollectionQuery(organizationQueryDefinition, {
      search: "acme_100%",
    });

    const qb = new QueryBuilder();
    const query = qb
      .select()
      .from(organizations)
      .where(compileDrizzleCollectionWhere(organizationQueryDefinition, collectionQuery))
      .limit(collectionQuery.limit)
      .offset(collectionQuery.offset);

    const { params, sql } = query.toSQL();

    assert.match(sql, / or /i);
    assert.match(sql, /ilike/);
    assert.deepEqual(params.slice(0, 2), ["%acme\\_100\\%%", "%acme\\_100\\%%"]);
  });

  test("combines search and filters with AND", () => {
    const collectionQuery = parseCollectionQuery(organizationQueryDefinition, {
      active: "eq.true",
      search: "acme",
    });

    const qb = new QueryBuilder();
    const query = qb
      .select()
      .from(organizations)
      .where(compileDrizzleCollectionWhere(organizationQueryDefinition, collectionQuery))
      .limit(collectionQuery.limit)
      .offset(collectionQuery.offset);

    const { params, sql } = query.toSQL();

    assert.match(sql, / and /i);
    assert.match(sql, / or /i);
    assert.deepEqual(params.slice(0, 3), ["%acme%", "%acme%", true]);
  });

  test("translates relationship filters and ordering to SQL", () => {
    const collectionQuery = parseCollectionQuery(projectQueryDefinition, {
      "organization:name": "ilike.*acme*",
      order: "organization:slug.asc",
    });

    const qb = new QueryBuilder();
    const query = qb
      .select()
      .from(projects)
      .innerJoin(organizations, eq(projects.organizationId, organizations.id))
      .where(compileDrizzleCollectionWhere(projectQueryDefinition, collectionQuery))
      .orderBy(...compileDrizzleCollectionOrderBy(projectQueryDefinition, collectionQuery))
      .limit(collectionQuery.limit)
      .offset(collectionQuery.offset);

    const { params, sql } = query.toSQL();

    assert.match(sql, /"organizations"/);
    assert.match(sql, /ilike/);
    assert.match(sql, /order by/);
    assert.equal(params[0], "%acme%");
  });

  test("translates relationship search to SQL", () => {
    const collectionQuery = parseCollectionQuery(projectQueryDefinition, {
      search: "acme",
    });

    const qb = new QueryBuilder();
    const query = qb
      .select()
      .from(projects)
      .innerJoin(organizations, eq(projects.organizationId, organizations.id))
      .where(compileDrizzleCollectionWhere(projectQueryDefinition, collectionQuery))
      .limit(collectionQuery.limit)
      .offset(collectionQuery.offset);

    const { params, sql } = query.toSQL();

    assert.match(sql, /"organizations"/);
    assert.match(sql, /"projects"/);
    assert.match(sql, / or /i);
    assert.deepEqual(params.slice(0, 2), ["%acme%", "%acme%"]);
  });
});
