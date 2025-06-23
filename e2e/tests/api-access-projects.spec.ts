import { expect, test } from "@playwright/test";

test.describe("Api projects", () => {
  test("list", async ({ page }) => {
    const list = await page.request.get("/api/projects");
    expect(list.status()).toBe(401);
  });
});
