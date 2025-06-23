import { expect, test } from "@playwright/test";

test.describe("Api members", () => {
  test("list", async ({ page }) => {
    const list = await page.request.get("/api/members");
    expect(list.status()).toBe(401);
  });
});
