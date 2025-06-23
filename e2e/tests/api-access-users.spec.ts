import { expect, test } from "@playwright/test";

test.describe("Api users", () => {
  test("list", async ({ page }) => {
    const list = await page.request.get("/api/users");
    expect(list.status()).toBe(401);
  });
});
