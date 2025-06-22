import { expect, test } from "@playwright/test";

test.describe("Api organizations", () => {
  test("list", async ({ page }) => {
    const list = await page.request.get("/api/organizations");
    expect(list.status()).toBe(401);
  });
});
