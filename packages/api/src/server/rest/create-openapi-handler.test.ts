import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { DatabaseInstance } from "@repo/database/clients";
import { emptyUpdateMessage } from "../../shared/contract/update";
import { adminSessionData, createMockAuth, userSessionData } from "../../testing/auth";
import {
  createMockDeleteDb,
  createMockDeleteDbError,
  createMockGetDb,
  createMockInsertDbError,
  createMockListDb,
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
});
