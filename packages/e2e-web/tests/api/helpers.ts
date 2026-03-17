import { type Browser, type Page } from "@playwright/test";
import { baseUrl, testUsers } from "../../config";
import { loginUser } from "../../utils";

export const RESOLVED_BASE_URL = process.env.BASE_URL || baseUrl;

export const ADMIN_USER_ID = "0198e599-eab0-7cb8-861f-72a8f6d7abb1";
export const REGULAR_USER_ID = "0198e59c-e576-78d2-8606-61f0275aca5a";
export const AVATAR_USER_ID = "0198e5a0-1cd3-78a5-9230-f4807fa7cb59";
export const TEST_ORGANIZATION_ID = "0198e5a9-39c8-70db-9c7d-e11ab6d9aea7";
export const TEST_PROJECT_ID = "0198e5a9-a975-7ac3-9eec-a70e2a3df131";
export const TEST_DATASET_ID = "0198e639-3e96-734b-b0db-af0c4350a2c4";
export const DATASET_WITH_VARIABLESETS_ID = "0198e639-3e96-734b-b0db-af0c4350a2c5";

export type AuthenticatedUser = keyof typeof testUsers;

export async function loginAs(page: Page, user: AuthenticatedUser) {
  await page.goto("/");
  await loginUser(page, testUsers[user].email, testUsers[user].password);
}

export async function withUserPage<T>(browser: Browser, user: AuthenticatedUser, callback: (page: Page) => Promise<T>) {
  const context = await browser.newContext({ baseURL: RESOLVED_BASE_URL });
  const page = await context.newPage();

  try {
    await loginAs(page, user);
    return await callback(page);
  } finally {
    await context.close();
  }
}
