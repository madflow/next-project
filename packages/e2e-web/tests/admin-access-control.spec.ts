import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Admin access control", () => {
  test("redirects regular users away from admin routes", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.regularUser.email, testUsers.regularUser.password);

    for (const route of ["/admin", "/admin/users"]) {
      await page.goto(route);
      await expect(page).toHaveURL("/project/test-project/adhoc");
    }
  });
});
