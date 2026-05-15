import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createAPIClient } from "../../client";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("createAPIClient coerces JSON date strings in validated OpenAPI responses", async () => {
  globalThis.fetch = (async (input, init) => {
    const url = input instanceof Request ? input.url : input instanceof URL ? input.toString() : String(input);

    assert.equal(new URL(url).pathname, "/api/organizations");
    assert.equal(init?.credentials, "include");

    return new Response(
      JSON.stringify({
        count: 1,
        limit: 5,
        offset: 0,
        rows: [
          {
            createdAt: "2024-01-01T00:00:00.000Z",
            id: "550e8400-e29b-41d4-a716-446655440001",
            logo: null,
            metadata: null,
            name: "Acme",
            settings: null,
            slug: "acme",
          },
        ],
      }),
      {
        headers: {
          "content-type": "application/json",
        },
        status: 200,
      }
    );
  }) as typeof fetch;

  const client = createAPIClient({
    apiPath: "/api",
    serverUrl: "http://localhost:3000",
  });

  const response = await client.organization.list({
    limit: "5",
    offset: "0",
  });

  assert.equal(response.rows[0]?.createdAt instanceof Date, true);
  assert.equal(response.rows[0]?.createdAt.toISOString(), "2024-01-01T00:00:00.000Z");
});
