import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { DatabaseInstance } from "@repo/database/clients";
import { emptyUpdateMessage } from "../../shared/contract/update";
import { adminSessionData, createMockAuth, userSessionData } from "../../testing/auth";
import {
  createMockDeleteDb,
  createMockDeleteDbError,
  createMockGetDb,
  createMockInsertDb,
  createMockInsertDbError,
  createMockListDb,
  createMockSequentialSelectDb,
  createMockUpdateDb,
} from "../../testing/router";
import { createOpenAPIHandler } from "./create-openapi-handler";

describe("createOpenAPIHandler", () => {
  test("returns 422 with detailed validation data for invalid POST input", async () => {
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: adminSessionData }),
      db: {} as DatabaseInstance,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request("http://localhost/rpc/organizations", {
        body: JSON.stringify({ slug: "acme" }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })
    );
    const body = (await response.json()) as {
      code: string;
      data?: {
        fieldErrors: Record<string, string[] | undefined>;
        formErrors: string[];
      };
      message: string;
    };

    assert.equal(response.status, 422);
    assert.equal(body.code, "INPUT_VALIDATION_FAILED");
    assert.ok(body.message.includes("name"));
    assert.ok(body.data);
    assert.ok(Array.isArray(body.data.fieldErrors.name));
    assert.deepEqual(body.data.formErrors, []);
    assert.equal(body.data.fieldErrors.name?.[0], "Invalid input: expected string, received undefined");
  });

  test("returns 200 with created users for valid POST requests", async () => {
    const row = {
      banExpires: null,
      banReason: null,
      banned: false,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      email: "new@example.com",
      emailVerified: false,
      id: "550e8400-e29b-41d4-a716-446655440099",
      image: null,
      locale: "en",
      name: "New User",
      role: "user",
      updatedAt: new Date("2024-01-02T00:00:00.000Z"),
    };
    const serializedRow = {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
    const { db } = createMockInsertDb(row);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: adminSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request("http://localhost/rpc/users", {
        body: JSON.stringify({
          banned: false,
          email: row.email,
          emailVerified: row.emailVerified,
          image: row.image,
          locale: row.locale,
          name: row.name,
          role: row.role,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })
    );
    const body = (await response.json()) as typeof serializedRow;

    assert.equal(response.status, 200);
    assert.deepEqual(body, serializedRow);
  });

  test("returns 200 with paginated users for valid GET collection requests", async () => {
    const rows = [
      {
        banExpires: null,
        banReason: null,
        banned: false,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        email: "user@example.com",
        emailVerified: true,
        id: "550e8400-e29b-41d4-a716-446655440010",
        image: null,
        locale: "en",
        name: "Regular User",
        role: "user",
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      },
    ];
    const serializedRows = rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
    const { db } = createMockListDb(rows, 1);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: adminSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request("http://localhost/rpc/users?limit=5&offset=2&order=name.asc", { method: "GET" })
    );
    const body = (await response.json()) as {
      count: number;
      limit: number;
      offset: number;
      orderBy: Array<{ direction: string; field: string }>;
      rows: typeof serializedRows;
    };

    assert.equal(response.status, 200);
    assert.deepEqual(body.rows, serializedRows);
    assert.equal(body.count, 1);
    assert.equal(body.limit, 5);
    assert.equal(body.offset, 2);
    assert.deepEqual(body.orderBy, [{ direction: "asc", field: "name" }]);
  });

  test("returns 200 with updated users for valid PUT requests", async () => {
    const row = {
      banExpires: null,
      banReason: null,
      banned: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      email: "user@example.com",
      emailVerified: true,
      id: "550e8400-e29b-41d4-a716-446655440010",
      image: null,
      locale: "de",
      name: "Regular User",
      role: "admin",
      updatedAt: new Date("2024-01-02T00:00:00.000Z"),
    };
    const serializedRow = {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
    const { db } = createMockUpdateDb(row);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: adminSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request(`http://localhost/rpc/users/${row.id}`, {
        body: JSON.stringify({ locale: row.locale, role: row.role }),
        headers: {
          "content-type": "application/json",
        },
        method: "PUT",
      })
    );
    const body = (await response.json()) as typeof serializedRow;

    assert.equal(response.status, 200);
    assert.deepEqual(body, serializedRow);
  });

  test("returns 200 with deleted users for valid DELETE requests", async () => {
    const row = {
      banExpires: null,
      banReason: null,
      banned: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      email: "user@example.com",
      emailVerified: true,
      id: "550e8400-e29b-41d4-a716-446655440010",
      image: null,
      locale: "en",
      name: "Regular User",
      role: "user",
      updatedAt: new Date("2024-01-02T00:00:00.000Z"),
    };
    const serializedRow = {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
    const { db } = createMockDeleteDb(row);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: adminSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(new Request(`http://localhost/rpc/users/${row.id}`, { method: "DELETE" }));
    const body = (await response.json()) as typeof serializedRow;

    assert.equal(response.status, 200);
    assert.deepEqual(body, serializedRow);
  });

  test("returns 409 with structured database error data for duplicate organization slugs", async () => {
    const duplicateSlugError = Object.assign(new Error("Failed query"), {
      cause: {
        code: "23505",
        constraint: "organizations_slug_unique",
        detail: "Key (slug)=(acme) already exists.",
        schema: "public",
        table: "organizations",
      },
    });
    const { db } = createMockInsertDbError(duplicateSlugError);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: adminSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request("http://localhost/rpc/organizations", {
        body: JSON.stringify({ name: "Acme", slug: "acme" }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })
    );
    const body = (await response.json()) as {
      code: string;
      data?: {
        fields?: string[];
        reason?: string;
      };
      message: string;
    };

    assert.equal(response.status, 409);
    assert.equal(body.code, "UNIQUE_VIOLATION");
    assert.equal(body.message, "Organization slug already exists");
    assert.deepEqual(body.data, {
      fields: ["slug"],
      reason: "already_exists",
    });
  });

  test("returns 200 with the updated organization for valid PUT requests", async () => {
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      id: "550e8400-e29b-41d4-a716-446655440000",
      logo: null,
      metadata: null,
      name: "Acme Updated",
      settings: null,
      slug: "acme",
    };
    const serializedRow = {
      ...row,
      createdAt: row.createdAt.toISOString(),
    };
    const { db } = createMockUpdateDb(row);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: adminSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request(`http://localhost/rpc/organizations/${row.id}`, {
        body: JSON.stringify({ name: row.name }),
        headers: {
          "content-type": "application/json",
        },
        method: "PUT",
      })
    );
    const body = (await response.json()) as typeof serializedRow;

    assert.equal(response.status, 200);
    assert.deepEqual(body, serializedRow);
  });

  test("returns 422 for empty organization PUT updates", async () => {
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: adminSessionData }),
      db: {} as DatabaseInstance,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request("http://localhost/rpc/organizations/550e8400-e29b-41d4-a716-446655440000", {
        body: JSON.stringify({}),
        headers: {
          "content-type": "application/json",
        },
        method: "PUT",
      })
    );
    const body = (await response.json()) as {
      code: string;
      data?: {
        fieldErrors: Record<string, string[] | undefined>;
        formErrors: string[];
      };
      message: string;
    };

    assert.equal(response.status, 422);
    assert.equal(body.code, "INPUT_VALIDATION_FAILED");
    assert.ok(body.message.includes(emptyUpdateMessage));
    assert.ok(body.data);
    assert.equal(body.data.formErrors.length, 0);
    assert.equal(body.data.fieldErrors.body?.[0], emptyUpdateMessage);
  });

  test("returns 200 with the deleted organization for valid DELETE requests", async () => {
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      id: "550e8400-e29b-41d4-a716-446655440000",
      logo: null,
      metadata: null,
      name: "Acme",
      settings: null,
      slug: "acme",
    };
    const serializedRow = {
      ...row,
      createdAt: row.createdAt.toISOString(),
    };
    const { db } = createMockDeleteDb(row);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: adminSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(new Request(`http://localhost/rpc/organizations/${row.id}`, { method: "DELETE" }));
    const body = (await response.json()) as typeof serializedRow;

    assert.equal(response.status, 200);
    assert.deepEqual(body, serializedRow);
  });

  test("returns 404 for missing organizations on DELETE", async () => {
    const { db } = createMockDeleteDb(undefined);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: adminSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request("http://localhost/rpc/organizations/550e8400-e29b-41d4-a716-446655440000", { method: "DELETE" })
    );
    const body = (await response.json()) as {
      code: string;
      message: string;
    };

    assert.equal(response.status, 404);
    assert.equal(body.code, "NOT_FOUND");
    assert.equal(body.message, "Organization not found");
  });

  test("returns 409 with structured database error data for delete constraint errors", async () => {
    const referencedOrganizationError = Object.assign(new Error("Failed query"), {
      cause: {
        code: "23503",
        constraint: "projects_organization_id_organizations_id_fk",
        detail: 'Key (id)=(550e8400-e29b-41d4-a716-446655440000) is still referenced from table "projects".',
        schema: "public",
        table: "organizations",
      },
    });
    const { db } = createMockDeleteDbError(referencedOrganizationError);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: adminSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request("http://localhost/rpc/organizations/550e8400-e29b-41d4-a716-446655440000", { method: "DELETE" })
    );
    const body = (await response.json()) as {
      code: string;
      data?: {
        fields?: string[];
        reason?: string;
      };
      message: string;
    };

    assert.equal(response.status, 409);
    assert.equal(body.code, "FOREIGN_KEY_VIOLATION");
    assert.equal(body.message, "Record is still referenced by other data");
    assert.deepEqual(body.data, {
      fields: ["id"],
      reason: "restricted",
    });
  });

  test("returns 404 for missing organizations on PUT", async () => {
    const { db } = createMockUpdateDb(undefined);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: adminSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request("http://localhost/rpc/organizations/550e8400-e29b-41d4-a716-446655440000", {
        body: JSON.stringify({ name: "Acme Updated" }),
        headers: {
          "content-type": "application/json",
        },
        method: "PUT",
      })
    );
    const body = (await response.json()) as {
      code: string;
      message: string;
    };

    assert.equal(response.status, 404);
    assert.equal(body.code, "NOT_FOUND");
    assert.equal(body.message, "Organization not found");
  });

  test("returns 401 for anonymous requests to admin routes", async () => {
    const { db } = createMockListDb([], 0);
    const handler = createOpenAPIHandler({ auth: createMockAuth(), db, pathPrefix: "/rpc" });

    const response = await handler(new Request("http://localhost/rpc/organizations", { method: "GET" }));
    const body = (await response.json()) as {
      code: string;
      message: string;
    };

    assert.equal(response.status, 401);
    assert.equal(body.code, "UNAUTHORIZED");
    assert.equal(body.message, "Missing user session. Please log in!");
  });

  test("returns 403 for authenticated non-admin requests", async () => {
    const { db } = createMockListDb([], 0);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: userSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(new Request("http://localhost/rpc/organizations", { method: "GET" }));
    const body = (await response.json()) as {
      code: string;
      message: string;
    };

    assert.equal(response.status, 403);
    assert.equal(body.code, "FORBIDDEN");
    assert.equal(body.message, "You do not have enough permission to perform this action.");
  });

  test("returns 200 with null for anonymous current user requests", async () => {
    const handler = createOpenAPIHandler({
      auth: createMockAuth(),
      db: {} as DatabaseInstance,
      pathPrefix: "/rpc",
    });

    const response = await handler(new Request("http://localhost/rpc/currentuser", { method: "GET" }));
    const body = (await response.json()) as null;

    assert.equal(response.status, 200);
    assert.equal(body, null);
  });

  test("returns 200 with an empty array for anonymous current user organizations requests", async () => {
    const handler = createOpenAPIHandler({
      auth: createMockAuth(),
      db: {} as DatabaseInstance,
      pathPrefix: "/rpc",
    });

    const response = await handler(new Request("http://localhost/rpc/currentuser/organizations", { method: "GET" }));
    const body = (await response.json()) as unknown[];

    assert.equal(response.status, 200);
    assert.deepEqual(body, []);
  });

  test("returns 200 with organization projects for organization members", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        id: "550e8400-e29b-41d4-a716-446655440002",
        metadata: null,
        name: "Acme Project",
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        slug: "acme-project",
        updatedAt: null,
      },
    ];
    const serializedRows = rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    }));
    const { db } = createMockSequentialSelectDb([[{ exists: true }], rows, [{ count: 1 }]]);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: userSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request(
        "http://localhost/rpc/organizations/550e8400-e29b-41d4-a716-446655440000/projects?limit=5&offset=2&order=name.asc",
        { method: "GET" }
      )
    );
    const body = (await response.json()) as {
      count: number;
      limit: number;
      offset: number;
      orderBy?: Array<{ direction: string; field: string }>;
      rows: typeof serializedRows;
    };

    assert.equal(response.status, 200);
    assert.deepEqual(body.rows, serializedRows);
    assert.equal(body.count, 1);
    assert.equal(body.limit, 5);
    assert.equal(body.offset, 2);
    assert.deepEqual(body.orderBy, [{ direction: "asc", field: "name" }]);
  });

  test("returns 403 for authenticated non-members on organization project lists", async () => {
    const { db } = createMockSequentialSelectDb([[{ exists: false }]]);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: userSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request("http://localhost/rpc/organizations/550e8400-e29b-41d4-a716-446655440000/projects", { method: "GET" })
    );
    const body = (await response.json()) as {
      code: string;
      message: string;
    };

    assert.equal(response.status, 403);
    assert.equal(body.code, "FORBIDDEN");
    assert.equal(body.message, "You do not have enough permission to perform this action.");
  });

  test("returns 200 with dataset projects for dataset members", async () => {
    const rows = [
      {
        datasetId: "550e8400-e29b-41d4-a716-446655440000",
        id: "550e8400-e29b-41d4-a716-446655440003",
        project: {
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          id: "550e8400-e29b-41d4-a716-446655440002",
          metadata: null,
          name: "Acme Project",
          organizationId: "550e8400-e29b-41d4-a716-446655440001",
          slug: "acme-project",
          updatedAt: null,
        },
        projectId: "550e8400-e29b-41d4-a716-446655440002",
      },
    ];
    const serializedRows = rows.map((row) => ({
      ...row,
      project: {
        ...row.project,
        createdAt: row.project.createdAt.toISOString(),
      },
    }));
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: true }],
      rows,
      [{ count: 1 }],
    ]);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: userSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request(
        "http://localhost/rpc/datasets/550e8400-e29b-41d4-a716-446655440000/projects?limit=5&offset=2&order=project:name.asc",
        { method: "GET" }
      )
    );
    const body = (await response.json()) as {
      count: number;
      limit: number;
      offset: number;
      orderBy?: Array<{ direction: string; field: string; relationship?: string }>;
      rows: typeof serializedRows;
    };

    assert.equal(response.status, 200);
    assert.deepEqual(body.rows, serializedRows);
    assert.equal(body.count, 1);
    assert.equal(body.limit, 5);
    assert.equal(body.offset, 2);
    assert.deepEqual(body.orderBy, [{ direction: "asc", field: "name", relationship: "project" }]);
  });

  test("returns 403 for authenticated non-members on dataset project lists", async () => {
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: false }],
    ]);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: userSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request("http://localhost/rpc/datasets/550e8400-e29b-41d4-a716-446655440000/projects", { method: "GET" })
    );
    const body = (await response.json()) as {
      code: string;
      message: string;
    };

    assert.equal(response.status, 403);
    assert.equal(body.code, "FORBIDDEN");
    assert.equal(body.message, "You do not have enough permission to perform this action.");
  });

  test("returns 200 with dataset split variables for dataset members", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        datasetId: "550e8400-e29b-41d4-a716-446655440000",
        id: "550e8400-e29b-41d4-a716-446655440004",
        variable: {
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          datasetId: "550e8400-e29b-41d4-a716-446655440000",
          id: "550e8400-e29b-41d4-a716-446655440003",
          label: "Age",
          measure: "scale",
          missingRanges: null,
          missingValues: null,
          name: "age",
          type: "int32",
          valueLabels: null,
          variableLabels: null,
        },
        variableId: "550e8400-e29b-41d4-a716-446655440003",
      },
    ];
    const serializedRows = rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      variable: {
        ...row.variable,
        createdAt: row.variable.createdAt.toISOString(),
      },
    }));
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: true }],
      rows,
      [{ count: 1 }],
    ]);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: userSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request(
        "http://localhost/rpc/datasets/550e8400-e29b-41d4-a716-446655440000/splitvariables?limit=5&offset=2&order=variable:name.asc",
        { method: "GET" }
      )
    );
    const body = (await response.json()) as {
      count: number;
      limit: number;
      offset: number;
      orderBy?: Array<{ direction: string; field: string; relationship?: string }>;
      rows: typeof serializedRows;
    };

    assert.equal(response.status, 200);
    assert.deepEqual(body.rows, serializedRows);
    assert.equal(body.count, 1);
    assert.equal(body.limit, 5);
    assert.equal(body.offset, 2);
    assert.deepEqual(body.orderBy, [{ direction: "asc", field: "name", relationship: "variable" }]);
  });

  test("returns 403 for authenticated non-members on dataset split variable lists", async () => {
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: false }],
    ]);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: userSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request("http://localhost/rpc/datasets/550e8400-e29b-41d4-a716-446655440000/splitvariables", {
        method: "GET",
      })
    );
    const body = (await response.json()) as {
      code: string;
      message: string;
    };

    assert.equal(response.status, 403);
    assert.equal(body.code, "FORBIDDEN");
    assert.equal(body.message, "You do not have enough permission to perform this action.");
  });

  test("returns 200 with dataset variables available for split for dataset members", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        datasetId: "550e8400-e29b-41d4-a716-446655440000",
        id: "550e8400-e29b-41d4-a716-446655440003",
        label: "Age",
        measure: "scale",
        missingRanges: null,
        missingValues: null,
        name: "age",
        type: "int32",
        valueLabels: null,
        variableLabels: null,
      },
    ];
    const serializedRows = rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    }));
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: true }],
      rows,
      [{ count: 1 }],
    ]);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: userSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request(
        "http://localhost/rpc/datasets/550e8400-e29b-41d4-a716-446655440000/variables/available-for-split?limit=5&offset=2&order=name.asc",
        { method: "GET" }
      )
    );
    const body = (await response.json()) as {
      count: number;
      limit: number;
      offset: number;
      orderBy?: Array<{ direction: string; field: string; relationship?: string }>;
      rows: typeof serializedRows;
    };

    assert.equal(response.status, 200);
    assert.deepEqual(body.rows, serializedRows);
    assert.equal(body.count, 1);
    assert.equal(body.limit, 5);
    assert.equal(body.offset, 2);
    assert.deepEqual(body.orderBy, [{ direction: "asc", field: "name" }]);
  });

  test("returns 403 for authenticated non-members on dataset available split variable lists", async () => {
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: false }],
    ]);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: userSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request("http://localhost/rpc/datasets/550e8400-e29b-41d4-a716-446655440000/variables/available-for-split", {
        method: "GET",
      })
    );
    const body = (await response.json()) as {
      code: string;
      message: string;
    };

    assert.equal(response.status, 403);
    assert.equal(body.code, "FORBIDDEN");
    assert.equal(body.message, "You do not have enough permission to perform this action.");
  });

  test("returns 200 with dataset variables for dataset members", async () => {
    const rows = [
      {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        datasetId: "550e8400-e29b-41d4-a716-446655440000",
        id: "550e8400-e29b-41d4-a716-446655440003",
        label: "Age",
        measure: "scale",
        missingRanges: null,
        missingValues: null,
        name: "age",
        type: "int32",
        valueLabels: null,
        variableLabels: null,
      },
    ];
    const serializedRows = rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    }));
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: true }],
      rows,
      [{ count: 1 }],
    ]);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: userSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request(
        "http://localhost/rpc/datasets/550e8400-e29b-41d4-a716-446655440000/variables?limit=5&offset=2&order=name.asc",
        { method: "GET" }
      )
    );
    const body = (await response.json()) as {
      count: number;
      limit: number;
      offset: number;
      orderBy?: Array<{ direction: string; field: string }>;
      rows: typeof serializedRows;
    };

    assert.equal(response.status, 200);
    assert.deepEqual(body.rows, serializedRows);
    assert.equal(body.count, 1);
    assert.equal(body.limit, 5);
    assert.equal(body.offset, 2);
    assert.deepEqual(body.orderBy, [{ direction: "asc", field: "name" }]);
  });

  test("returns 403 for authenticated non-members on dataset variable lists", async () => {
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: false }],
    ]);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: userSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request("http://localhost/rpc/datasets/550e8400-e29b-41d4-a716-446655440000/variables", { method: "GET" })
    );
    const body = (await response.json()) as {
      code: string;
      message: string;
    };

    assert.equal(response.status, 403);
    assert.equal(body.code, "FORBIDDEN");
    assert.equal(body.message, "You do not have enough permission to perform this action.");
  });

  test("returns 200 with flat dataset variablesets for dataset members", async () => {
    const rows = [
      {
        attributes: null,
        category: "general",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        datasetId: "550e8400-e29b-41d4-a716-446655440000",
        description: "Top level set",
        id: "550e8400-e29b-41d4-a716-446655440005",
        name: "Demographics",
        orderIndex: 100,
        parentId: null,
        updatedAt: null,
      },
    ];
    const serializedRows = rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    }));
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: true }],
      rows,
      [{ count: 1 }],
    ]);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: userSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request(
        "http://localhost/rpc/datasets/550e8400-e29b-41d4-a716-446655440000/variablesets?limit=5&offset=2&search=demo",
        { method: "GET" }
      )
    );
    const body = (await response.json()) as {
      count: number;
      limit: number;
      offset: number;
      orderBy?: Array<{ direction: string; field: string; relationship?: string }>;
      rows: typeof serializedRows;
    };

    assert.equal(response.status, 200);
    assert.deepEqual(body.rows, serializedRows);
    assert.equal(body.count, 1);
    assert.equal(body.limit, 5);
    assert.equal(body.offset, 2);
    assert.deepEqual(body.orderBy, [
      { direction: "asc", field: "orderIndex" },
      { direction: "asc", field: "name" },
    ]);
  });

  test("returns 200 with hierarchical dataset variablesets for dataset members", async () => {
    const hierarchyRows = [
      {
        attributes: null,
        category: "general",
        description: "Top level set",
        id: "550e8400-e29b-41d4-a716-446655440005",
        name: "Demographics",
        orderIndex: 100,
        parentId: null,
        variableCount: "2",
      },
      {
        attributes: null,
        category: "general",
        description: "Nested set",
        id: "550e8400-e29b-41d4-a716-446655440006",
        name: "Age Group",
        orderIndex: 200,
        parentId: "550e8400-e29b-41d4-a716-446655440005",
        variableCount: "1",
      },
    ];
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: true }],
      hierarchyRows,
    ]);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: userSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request(
        "http://localhost/rpc/datasets/550e8400-e29b-41d4-a716-446655440000/variablesets?hierarchical=true&limit=1000&offset=0",
        { method: "GET" }
      )
    );
    const body = (await response.json()) as
      | {
          hierarchy: Array<{
            children: unknown[];
            id: string;
            level: number;
            variableCount: number;
          }>;
        }
      | {
          code: string;
          message: string;
        };

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      hierarchy: [
        {
          attributes: null,
          category: "general",
          children: [
            {
              attributes: null,
              category: "general",
              children: [],
              description: "Nested set",
              id: "550e8400-e29b-41d4-a716-446655440006",
              level: 1,
              name: "Age Group",
              orderIndex: 200,
              parentId: "550e8400-e29b-41d4-a716-446655440005",
              variableCount: 1,
            },
          ],
          description: "Top level set",
          id: "550e8400-e29b-41d4-a716-446655440005",
          level: 0,
          name: "Demographics",
          orderIndex: 100,
          parentId: null,
          variableCount: 2,
        },
      ],
    });
  });

  test("returns 403 for authenticated non-members on dataset variableset lists", async () => {
    const { db } = createMockSequentialSelectDb([
      [{ organizationId: "550e8400-e29b-41d4-a716-446655440000" }],
      [{ exists: false }],
    ]);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: userSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request("http://localhost/rpc/datasets/550e8400-e29b-41d4-a716-446655440000/variablesets", { method: "GET" })
    );
    const body = (await response.json()) as {
      code: string;
      message: string;
    };

    assert.equal(response.status, 403);
    assert.equal(body.code, "FORBIDDEN");
    assert.equal(body.message, "You do not have enough permission to perform this action.");
  });

  test("returns 200 with the project for valid GET by id requests", async () => {
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      id: "550e8400-e29b-41d4-a716-446655440002",
      metadata: null,
      name: "Acme Project",
      organizationId: userSessionData.session.userId,
      slug: "acme-project",
      updatedAt: null,
    };
    const serializedRow = {
      ...row,
      createdAt: row.createdAt.toISOString(),
    };
    const { db } = createMockGetDb(row);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: adminSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(new Request(`http://localhost/rpc/projects/${row.id}`, { method: "GET" }));
    const body = (await response.json()) as typeof serializedRow;

    assert.equal(response.status, 200);
    assert.deepEqual(body, serializedRow);
  });

  test("returns 200 with the dataset for valid GET by id requests", async () => {
    const row = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      description: null,
      fileHash: "hash_1",
      filename: "acme.csv",
      fileSize: 123,
      fileType: "csv",
      id: "550e8400-e29b-41d4-a716-446655440002",
      name: "Acme Dataset",
      organizationId: userSessionData.session.userId,
      storageKey: "datasets/acme.csv",
      updatedAt: null,
      uploadedAt: new Date("2024-01-01T00:00:00.000Z"),
    };
    const serializedRow = {
      ...row,
      createdAt: row.createdAt.toISOString(),
      uploadedAt: row.uploadedAt.toISOString(),
    };
    const { db } = createMockGetDb(row);
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: adminSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(new Request(`http://localhost/rpc/datasets/${row.id}`, { method: "GET" }));
    const body = (await response.json()) as typeof serializedRow;

    assert.equal(response.status, 200);
    assert.deepEqual(body, serializedRow);
  });

  test("returns 422 for invalid embeds on GET by id requests", async () => {
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: adminSessionData }),
      db: {} as DatabaseInstance,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request("http://localhost/rpc/projects/550e8400-e29b-41d4-a716-446655440002?embed=owner", { method: "GET" })
    );
    const body = (await response.json()) as {
      code: string;
      message: string;
    };

    assert.equal(response.status, 422);
    assert.equal(body.code, "INPUT_VALIDATION_FAILED");
    assert.ok(body.message.includes("Unknown embed 'owner'"));
  });

  test("returns 422 for invalid dataset embeds on GET by id requests", async () => {
    const handler = createOpenAPIHandler({
      auth: createMockAuth({ session: adminSessionData }),
      db: {} as DatabaseInstance,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request("http://localhost/rpc/datasets/550e8400-e29b-41d4-a716-446655440002?embed=owner", { method: "GET" })
    );
    const body = (await response.json()) as {
      code: string;
      message: string;
    };

    assert.equal(response.status, 422);
    assert.equal(body.code, "INPUT_VALIDATION_FAILED");
    assert.ok(body.message.includes("Unknown embed 'owner'"));
  });
});
