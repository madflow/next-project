import { type Browser, type Page } from "@playwright/test";
import { type AuthenticatedUser, resolvedBaseUrl, testUsers } from "../../config";
import { loginUser } from "../../utils";

export async function loginAs(page: Page, user: AuthenticatedUser) {
  await page.goto("/");
  await loginUser(page, testUsers[user].email, testUsers[user].password);
}

export async function withUserPage<T>(browser: Browser, user: AuthenticatedUser, callback: (page: Page) => Promise<T>) {
  const context = await browser.newContext({ baseURL: resolvedBaseUrl });
  const page = await context.newPage();

  try {
    await loginAs(page, user);
    return await callback(page);
  } finally {
    await context.close();
  }
}
