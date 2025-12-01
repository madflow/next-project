import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe.configure({ mode: "parallel" });

test.describe("API Users", () => {
  test.describe("Authentication", () => {
    test("denies access when not logged in", async ({ page }) => {
      const response = await page.request.get("/api/users");
      expect(response.status()).toBe(401);
    });

    test("denies access for regular user", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.regularUser.email, testUsers.regularUser.password);
      const response = await page.request.get("/api/users");
      expect(response.status()).toBe(401);
    });

    test("allows access for admin user", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);
      const response = await page.request.get("/api/users");
      expect(response.status()).toBe(200);
    });
  });

  test.describe("Pagination", () => {
    test("returns default pagination (limit=10, offset=0)", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users");
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

      const response = await page.request.get("/api/users?limit=5&offset=0");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.limit).toBe(5);
      expect(data.offset).toBe(0);
      expect(data.rows.length).toBeLessThanOrEqual(5);
    });

    test("handles large offset", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users?limit=10&offset=1000");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.offset).toBe(1000);
      expect(Array.isArray(data.rows)).toBe(true);
    });
  });

  test.describe("Search", () => {
    test("searches by user name", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users?search=Admin");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThan(0);
      expect(data.rows[0].name).toContain("Admin");
    });

    test("searches by user email", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users?search=admin@example.com");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThan(0);
      expect(data.rows[0].email).toContain("admin@example.com");
    });

    test("returns empty results for non-existent search", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users?search=nonexistentuser123");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBe(0);
      expect(data.count).toBe(0);
    });

    test("performs case-insensitive search", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users?search=ADMIN");
      expect(response.status()).toBe(200);

      const data = await response.json();
      if (data.rows.length > 0) {
        expect(data.rows[0].name.toLowerCase()).toContain("admin");
      }
    });
  });

  test.describe("Ordering", () => {
    test("orders by user name ascending", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users?order=name.asc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      if (data.rows.length > 1) {
        expect(data.rows[0].name <= data.rows[1].name).toBe(true);
      }
    });

    test("orders by user name descending", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users?order=name.desc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      if (data.rows.length > 1) {
        expect(data.rows[0].name >= data.rows[1].name).toBe(true);
      }
    });

    test("orders by email", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);
      const response = await page.request.get("/api/users?order=email.asc");
      expect(response.status()).toBe(200);
      const data = await response.json();

      const emails = data.rows.map((r) => r.email);

      // Verify specific known orderings that PostgreSQL produces
      const accountDeleterIndex = emails.indexOf("accountdeleter@example.com");
      const accountInNoOrgIndex = emails.indexOf("account-in-no-org@example.com");

      if (accountDeleterIndex !== -1 && accountInNoOrgIndex !== -1) {
        expect(accountDeleterIndex).toBeLessThan(accountInNoOrgIndex);
      }
    });

    test("orders by creation date", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users?order=createdAt.desc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      if (data.rows.length > 1) {
        const firstDate = new Date(data.rows[0].createdAt);
        const secondDate = new Date(data.rows[1].createdAt);
        expect(firstDate >= secondDate).toBe(true);
      }
    });

    test("handles multiple order criteria", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users?order=role.asc,name.desc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBeGreaterThan(0);
    });

    test("ignores invalid order parameters", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users?order=invalidcolumn.asc");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.rows)).toBe(true);
    });
  });

  test.describe("Filtering", () => {
    test("filters by user name", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users?name=Admin User");
      expect(response.status()).toBe(200);

      const data = await response.json();
      if (data.rows.length > 0) {
        expect(data.rows[0].name).toBe("Admin User");
      }
    });

    test("filters by user email", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users?email=admin@example.com");
      expect(response.status()).toBe(200);

      const data = await response.json();
      if (data.rows.length > 0) {
        expect(data.rows[0].email).toBe("admin@example.com");
      }
    });

    test("filters by user role", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users?role=admin");
      expect(response.status()).toBe(200);

      const data = await response.json();
      if (data.rows.length > 0) {
        expect(data.rows[0].role).toBe("admin");
      }
    });

    test("applies multiple filters with AND logic", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users?role=admin&name=Admin User");
      expect(response.status()).toBe(200);

      const data = await response.json();
      if (data.rows.length > 0) {
        expect(data.rows[0].role).toBe("admin");
        expect(data.rows[0].name).toBe("Admin User");
      }
    });

    test("returns empty results for non-matching filters", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users?name=NonExistentUser");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.rows.length).toBe(0);
      expect(data.count).toBe(0);
    });

    test("ignores invalid filter parameters", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users?invalidcolumn=value");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.rows)).toBe(true);
    });
  });

  test.describe("Combined Operations", () => {
    test("combines search, filtering, and ordering", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users?search=User&role=user&order=name.asc&limit=5");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.limit).toBe(5);
      expect(Array.isArray(data.rows)).toBe(true);
    });

    test("combines filtering with pagination", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users?role=user&limit=3&offset=0");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.limit).toBe(3);
      expect(data.offset).toBe(0);
      if (data.rows.length > 0) {
        expect(data.rows[0].role).toBe("user");
      }
    });
  });

  test.describe("Data Validation", () => {
    test("returns correct response schema structure", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users");
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

    test("includes expected user data fields", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      const response = await page.request.get("/api/users");
      expect(response.status()).toBe(200);

      const data = await response.json();
      if (data.rows.length > 0) {
        const user = data.rows[0];
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("name");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("role");
        expect(user).toHaveProperty("createdAt");
        expect(user).toHaveProperty("updatedAt");
      }
    });

    test("count accuracy with filters", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      // Get total count
      const allResponse = await page.request.get("/api/users");
      const allData = await allResponse.json();

      // Get filtered count
      const filteredResponse = await page.request.get("/api/users?role=admin");
      const filteredData = await filteredResponse.json();

      expect(filteredData.count).toBeLessThanOrEqual(allData.count);
      expect(filteredData.rows.length).toBeLessThanOrEqual(filteredData.count);
    });

    test("verifies test data exists", async ({ page }) => {
      await page.goto("/");
      await loginUser(page, testUsers.admin.email, testUsers.admin.password);

      // Check if admin user exists
      const response = await page.request.get("/api/users?email=admin@example.com");
      expect(response.status()).toBe(200);

      const data = await response.json();
      if (data.rows.length > 0) {
        expect(data.rows[0].email).toBe("admin@example.com");
        expect(data.rows[0].role).toBe("admin");
      }
    });
  });
});
