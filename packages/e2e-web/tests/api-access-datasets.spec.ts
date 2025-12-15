import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe.configure({ mode: "parallel" });

test.describe("API Datasets", () => {
  test.describe("Authentication", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.get("/api/datasets");
      expect(response.status()).toBe(401);
    });

    test("denies access for regular user", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.regularUser.email, testUsers.regularUser.password);
      const response = await page.request.get("/api/datasets");
      expect(response.status()).toBe(401);
    });

    test("allows access for admin user", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);
      const response = await page.request.get("/api/datasets");
      expect(response.status()).toBe(200);
    });
  });

  test.describe("Pagination", () => {
    test("returns default pagination (limit=10, offset=0)", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/datasets");
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

      const response = await page.request.get("/api/datasets?limit=5&offset=0");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.limit).toBe(5);
      expect(data.offset).toBe(0);
      expect(data.rows.length).toBeLessThanOrEqual(5);
    });

    test("handles large offset", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/datasets?limit=10&offset=1000");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.offset).toBe(1000);
      expect(Array.isArray(data.rows)).toBe(true);
    });
  });

  test.describe("Search", () => {
    test("searches by dataset name", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/datasets?search=test");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThan(0);
      expect(data.rows[0].name.toLowerCase()).toContain("test");
    });
  });

  test.describe("Ordering", () => {
    test("orders by dataset name ascending", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/datasets?order=name.asc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThanOrEqual(2);
      expect(data.rows[0].name <= data.rows[1].name).toBe(true);
    });

    test("orders by dataset name descending", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/datasets?order=name.desc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThanOrEqual(2);
      expect(data.rows[0].name >= data.rows[1].name).toBe(true);
    });

    test("orders by dataset filename", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/datasets?order=filename.asc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThanOrEqual(2);
      expect(data.rows[0].filename <= data.rows[1].filename).toBe(true);
    });

    test("orders by creation date", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/datasets?order=createdAt.desc");
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

      const response = await page.request.get("/api/datasets?order=name.asc,slug.desc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThanOrEqual(0);
    });

    test("ignores invalid order parameters", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/datasets?order=invalidcolumn.asc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.rows)).toBe(true);
    });
  });

  test.describe("Filtering", () => {
    test("filters by dataset name", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/datasets?filename=demo.sav");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows[0].name.toLowerCase()).toContain("test");
    });

    test("filters by dataset filename", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/datasets?filename=demo.sav");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThan(0);
      expect(data.rows[0].filename).toBe("demo.sav");
    });

    test("applies multiple filters with AND logic", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/datasets?name=demo.sav&slug=demo-sav");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows[0].name).toBe("demo.sav");
      expect(data.rows[0].slug).toBe("demo-sav");
    });

    test("returns empty results for non-matching filters", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/datasets?name=NonExistentDataset");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBe(0);
      expect(data.count).toBe(0);
    });

    test("ignores invalid filter parameters", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/datasets?invalidcolumn=value");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.rows)).toBe(true);
    });
  });

  test.describe("Combined Operations", () => {
    test("combines search, filtering, and ordering", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/datasets?search=demo&name=demo.sav&order=name.asc&limit=5");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.limit).toBe(5);
      expect(Array.isArray(data.rows)).toBe(true);
    });

    test("combines filtering with pagination", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/datasets?filename=demo.sav&limit=3&offset=0");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.limit).toBe(3);
      expect(data.offset).toBe(0);
      expect(data.rows.length).toBeGreaterThan(0);
      expect(data.rows[0].filename).toBe("demo.sav");
    });
  });

  test.describe("Data Validation", () => {
    test("returns correct response schema structure", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/datasets");
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

    test("includes expected dataset data fields", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/datasets");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThan(0);
      const dataset = data.rows[0];
      expect(dataset).toHaveProperty("id");
      expect(dataset).toHaveProperty("name");
      expect(dataset).toHaveProperty("filename");
      expect(dataset).toHaveProperty("createdAt");
      expect(dataset).toHaveProperty("updatedAt");
    });

    test("count accuracy with filters", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      // Get total count
      const allResponse = await page.request.get("/api/datasets");
      const allData = await allResponse.json();

      // Get filtered count
      const filteredResponse = await page.request.get("/api/datasets?name=demo.sav");
      const filteredData = await filteredResponse.json();

      expect(filteredData.count).toBeLessThanOrEqual(allData.count);
      expect(filteredData.rows.length).toBeLessThanOrEqual(filteredData.count);
    });

    test("verifies test data exists", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      // Check if test dataset exists
      const response = await page.request.get("/api/datasets?name=demo.sav");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThan(0);
      expect(data.rows[0].name).toBe("demo.sav");
      expect(data.rows[0].slug).toBe("demo-sav");
    });
  });

  test.describe("Project Datasets", () => {
    test("list project datasets as admin user", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/projects/0198e5a9-a975-7ac3-9eec-a70e2a3df131/datasets");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.count).toBeGreaterThan(0);
    });

    test("deny project datasets as unauthorized user", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.accountInNoOrg.email, testUsers.accountInNoOrg.password);

      const response = await page.request.get("/api/projects/0198e5a9-a975-7ac3-9eec-a70e2a3df131/datasets");
      expect(response.status()).toBe(401);
    });

    test("list project datasets as authorized regular user", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.regularUser.email, testUsers.regularUser.password);

      const response = await page.request.get("/api/projects/0198e5a9-a975-7ac3-9eec-a70e2a3df131/datasets");
      expect(response.status()).toBe(200);
    });
  });
});
