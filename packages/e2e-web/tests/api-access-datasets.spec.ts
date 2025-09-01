import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Api access datasets", () => {
  test.describe.configure({ mode: "parallel" });
  test("list not logged in", async ({ page }) => {
    const notLoggedIn = await page.request.get("/api/datasets");
    expect(notLoggedIn.status()).toBe(401);
  });

  test("list logged in as regular user", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.regularUser.email, testUsers.regularUser.password);
    const list = await page.request.get("/api/datasets");
    expect(list.status()).toBe(401);
  });

  test("list logged in as admin user", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    const list = await page.request.get("/api/datasets");
    expect(list.status()).toBe(200);
  });

  test("list project datasets as admin user", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    const list = await page.request.get("/api/projects/0198e5ac-7a6c-7d0c-bedd-6a74ff7bfe59/datasets");
    const body = await list.json();
    expect(body.count).toBe(1);
    expect(list.status()).toBe(200);
  });

  test("deny project datasets as regular user", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.accountInNoOrg.email, testUsers.accountInNoOrg.password);
    const list = await page.request.get("/api/projects/0198e5a9-a975-7ac3-9eec-a70e2a3df131/datasets");
    expect(list.status()).toBe(401);
  });

  test("list project datasets as regular user", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.regularUser.email, testUsers.regularUser.password);
    const list = await page.request.get("/api/projects/0198e5a9-a975-7ac3-9eec-a70e2a3df131/datasets");
    expect(list.status()).toBe(200);
  });
});
