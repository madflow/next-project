import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe.configure({ mode: "parallel" });

test.describe("API Organizations", () => {
  test.describe("Authentication", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.get("/api/organizations");
      expect(response.status()).toBe(401);
    });

    test("denies access for regular user", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.regularUser.email, testUsers.regularUser.password);
      const response = await page.request.get("/api/organizations");
      expect(response.status()).toBe(401);
    });

    test("allows access for admin user", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);
      const response = await page.request.get("/api/organizations");
      expect(response.status()).toBe(200);
    });
  });

  test.describe("Pagination", () => {
    test("returns default pagination (limit=10, offset=0)", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("rows");
      expect(data).toHaveProperty("count");
      expect(data).toHaveProperty("limit", 10);
      expect(data).toHaveProperty("offset", 0);
      expect(Array.isArray(data.rows)).toBe(true);
    });

    test("respects custom pagination parameters", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations?limit=5&offset=0");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.limit).toBe(5);
      expect(data.offset).toBe(0);
      expect(data.rows.length).toBeLessThanOrEqual(5);
    });

    test("handles large offset", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations?limit=10&offset=1000");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.offset).toBe(1000);
      expect(Array.isArray(data.rows)).toBe(true);
    });
  });

  test.describe("Search", () => {
    test("searches by organization name", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations?search=Test Organization");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThan(0);
      expect(data.rows[0].name).toContain("Test");
    });

    test("searches by organization slug", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations?search=test-organization");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThan(0);
    });

    test("returns empty results for non-existent search", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations?search=nonexistentorg123");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBe(0);
      expect(data.count).toBe(0);
    });

    test("performs case-insensitive search", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations?search=TEST");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows[0].name.toLowerCase()).toContain("test");
    });
  });

  test.describe("Ordering", () => {
    test("orders by organization name ascending", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations?order=name.asc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows[0].name <= data.rows[1].name).toBe(true);
    });

    test("orders by organization name descending", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations?order=name.desc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows[0].name >= data.rows[1].name).toBe(true);
    });

    test("orders by organization slug", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations?order=slug.asc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows[0].slug <= data.rows[1].slug).toBe(true);
    });

    test("orders by creation date", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations?order=createdAt.desc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      const firstDate = new Date(data.rows[0].createdAt);
      const secondDate = new Date(data.rows[1].createdAt);
      expect(firstDate >= secondDate).toBe(true);
    });

    test("handles multiple order criteria", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations?order=name.asc,slug.desc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThan(0);
    });

    test("ignores invalid order parameters", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations?order=invalidcolumn.asc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.rows)).toBe(true);
    });
  });

  test.describe("Filtering", () => {
    test("filters by organization name", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations?name=Test Organization");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows[0].name).toBe("Test Organization");
    });

    test("filters by organization slug", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations?slug=test-organization");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows[0].slug).toBe("test-organization");
    });

    test("applies multiple filters with AND logic", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations?name=Test Organization&slug=test-organization");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows[0].name).toBe("Test Organization");
      expect(data.rows[0].slug).toBe("test-organization");
    });

    test("returns empty results for non-matching filters", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations?name=NonExistentOrganization");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBe(0);
      expect(data.count).toBe(0);
    });

    test("ignores invalid filter parameters", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations?invalidcolumn=value");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.rows)).toBe(true);
    });
  });

  test.describe("Combined Operations", () => {
    test("combines search, filtering, and ordering", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get(
        "/api/organizations?search=Test&name=Test Organization&order=name.asc&limit=5"
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.limit).toBe(5);
      expect(Array.isArray(data.rows)).toBe(true);
    });

    test("combines filtering with pagination", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations?slug=test-organization&limit=3&offset=0");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.limit).toBe(3);
      expect(data.offset).toBe(0);
      expect(data.rows[0].slug).toBe("test-organization");
    });
  });

  test.describe("Data Validation", () => {
    test("returns correct response schema structure", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("rows");
      expect(data).toHaveProperty("count");
      expect(data).toHaveProperty("limit");
      expect(data).toHaveProperty("offset");
      expect(Array.isArray(data.rows)).toBe(true);
      expect(typeof data.count).toBe("number");
      expect(typeof data.limit).toBe("number");
      expect(typeof data.offset).toBe("number");
    });

    test("includes expected organization data fields", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/organizations");
      expect(response.status()).toBe(200);

      const data = await response.json();
      const organization = data.rows[0];
      expect(organization).toHaveProperty("id");
      expect(organization).toHaveProperty("name");
      expect(organization).toHaveProperty("slug");
      expect(organization).toHaveProperty("createdAt");
    });

    test("count accuracy with filters", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      // Get total count
      const allResponse = await page.request.get("/api/organizations");
      const allData = await allResponse.json();

      // Get filtered count
      const filteredResponse = await page.request.get("/api/organizations?name=Test Organization");
      const filteredData = await filteredResponse.json();

      expect(filteredData.count).toBeLessThanOrEqual(allData.count);
      expect(filteredData.rows.length).toBeLessThanOrEqual(filteredData.count);
    });

    test("verifies test data exists", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      // Check if test organization exists
      const response = await page.request.get("/api/organizations?name=Test Organization");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows[0].name).toBe("Test Organization");
      expect(data.rows[0].slug).toBe("test-organization");
    });
  });
});
