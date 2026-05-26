import { expect, test } from "@playwright/test";
import { testIds, testUsers } from "../../config";
import { loginUser } from "../../utils";

const TEST_PROJECT_ID = testIds.projects.primary;
const TEST_ORGANIZATION_ID = testIds.organizations.primary;

test.describe("API Projects @api", () => {
  test.describe("Authentication", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.get("/api/projects");
      expect(response.status()).toBe(401);
    });

    test("allows access for regular user in organization", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.regularUser.email, testUsers.regularUser.password);
      const response = await page.request.get("/api/projects");

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.rows)).toBe(true);
      expect(data.rows.length).toBeGreaterThan(0);
    });

    test("allows access for admin user", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);
      const response = await page.request.get("/api/projects");
      expect(response.status()).toBe(200);
    });
  });

  test.describe("Pagination", () => {
    test("returns default pagination (limit=10, offset=0)", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects");
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

      const response = await page.request.get("/api/projects?limit=5&offset=0");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.limit).toBe(5);
      expect(data.offset).toBe(0);
      expect(data.rows.length).toBeLessThanOrEqual(5);
    });

    test("handles large offset", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects?limit=10&offset=1000");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.offset).toBe(1000);
      expect(Array.isArray(data.rows)).toBe(true);
    });
  });

  test.describe("Search", () => {
    test("searches by project name", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects?search=Test Project");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThan(0);
      expect(data.rows[0].name).toContain("Test");
    });

    test("searches by project slug", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects?search=test-project");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThan(0);
    });

    test("returns empty results for non-existent search", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects?search=nonexistentproject123");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows).toHaveLength(0);
      expect(data.count).toBe(0);
    });

    test("performs case-insensitive search", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects?search=TEST");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows[0].name.toLowerCase()).toContain("test");
    });
  });

  test.describe("Ordering", () => {
    test("orders by project name ascending", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects?order=name.asc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows[0].name <= data.rows[1].name).toBe(true);
    });

    test("orders by project name descending", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects?order=name.desc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThanOrEqual(2);
      expect(data.rows[0].name >= data.rows[1].name).toBe(true);
    });

    test("orders by organization name using joined table syntax", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects?embed=organization&order=organization:name.asc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThan(0);
      expect(data.rows[0]).toHaveProperty("organization");
      expect(data.rows[0].organization).toHaveProperty("name");
    });

    test("orders by creation date", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects?order=createdAt.desc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThanOrEqual(2);
      const firstDate = new Date(data.rows[0].createdAt);
      const secondDate = new Date(data.rows[1].createdAt);
      expect(firstDate >= secondDate).toBe(true);
    });

    test("handles multiple order criteria", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects?embed=organization&order=organization:name.asc,name.desc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThan(0);
    });

    test("rejects invalid order parameters", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects?order=invalidcolumn.asc");
      expect(response.status()).toBe(422);

      const data = await response.json();
      expect(data.code).toBe("INPUT_VALIDATION_FAILED");
    });
  });

  test.describe("Filtering", () => {
    test("filters by project name", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects?name=Test Project");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows[0].name).toBe("Test Project");
    });

    test("filters by project slug", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects?slug=test-project");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows[0].slug).toBe("test-project");
    });

    test("filters by organization name using joined table syntax", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects?embed=organization&organization:name=Test Organization");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows[0]).toHaveProperty("organization");
      expect(data.rows[0].organization.name).toBe("Test Organization");
    });

    test("filters by organization slug using joined table syntax", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects?embed=organization&organization:slug=test-organization");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows[0].organization.slug).toBe("test-organization");
    });

    test("applies multiple filters with AND logic", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get(
        "/api/projects?embed=organization&name=Test Project&organization:name=Test Organization"
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows[0].name).toBe("Test Project");
      expect(data.rows[0].organization.name).toBe("Test Organization");
    });

    test("returns empty results for non-matching filters", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects?name=NonExistentProject");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows).toHaveLength(0);
      expect(data.count).toBe(0);
    });

    test("rejects invalid filter parameters", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects?invalidcolumn=value");
      expect(response.status()).toBe(422);

      const data = await response.json();
      expect(data.code).toBe("INPUT_VALIDATION_FAILED");
    });
  });

  test.describe("Combined Operations", () => {
    test("combines search, filtering, and ordering", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get(
        "/api/projects?embed=organization&search=Test&organization:name=Test Organization&order=name.asc&limit=5"
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.limit).toBe(5);
      expect(Array.isArray(data.rows)).toBe(true);
    });

    test("combines filtering with pagination", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get(
        "/api/projects?embed=organization&organization:name=Test Organization&limit=3&offset=0"
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.limit).toBe(3);
      expect(data.offset).toBe(0);
      expect(data.rows[0].organization.name).toBe("Test Organization");
    });
  });

  test.describe("Data Validation", () => {
    test("returns correct response schema structure", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects");
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

    test("includes joined organization data in project records", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects?embed=organization");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThan(0);
      const project = data.rows[0];
      expect(project).toHaveProperty("id");
      expect(project).toHaveProperty("name");
      expect(project).toHaveProperty("slug");
      expect(project).toHaveProperty("organizationId");
      expect(project).toHaveProperty("organization");
      expect(project.organization).toHaveProperty("id");
      expect(project.organization).toHaveProperty("name");
      expect(project.organization).toHaveProperty("slug");
    });

    test("count accuracy with filters", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      // Get total count
      const allResponse = await page.request.get("/api/projects");
      const allData = await allResponse.json();

      // Get filtered count
      const filteredResponse = await page.request.get("/api/projects?organization:name=Test Organization");
      const filteredData = await filteredResponse.json();

      expect(filteredData.count).toBeLessThanOrEqual(allData.count);
      expect(filteredData.rows.length).toBeLessThanOrEqual(filteredData.count);
    });

    test("verifies test data exists", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      // Check if test project exists
      const response = await page.request.get(`/api/projects?embed=organization&id=${TEST_PROJECT_ID}`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows[0].id).toBe(TEST_PROJECT_ID);
      expect(data.rows[0].organization.id).toBe(TEST_ORGANIZATION_ID);
    });
  });
});
