import { Page } from "@playwright/test";
import { MailpitClient } from "mailpit-api";
import assert from "node:assert";

const { SMTP_SERVER_API } = process.env;
assert(SMTP_SERVER_API);

const smtpServerApi = new MailpitClient(SMTP_SERVER_API);

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loginUser(page: Page, email: string, password: string) {
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("data-testid=auth.login.form.email");
  await page.getByTestId("auth.login.form.email").fill(email);
  await page.getByTestId("auth.login.form.password").fill(password);

  const getSessionResponse = page.waitForResponse(
    (response) => response.url().includes("/api/auth/get-session") && response.status() === 200
  );
  await page.getByTestId("auth.login.form.submit").click();

  await getSessionResponse;

  await page.waitForLoadState("networkidle");
  await page.waitForSelector("data-testid=app.sidebar.user-menu-trigger");
}

export async function logoutUser(page: Page) {
  await page.getByTestId("app.sidebar.user-menu-trigger").click();
  await page.getByTestId("app.sign-out").click();
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("data-testid=auth.login.form.submit");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extractLinkFromMessage = async (message: any, linkFragment: string) => {
  const linkCheck = await smtpServerApi.linkCheck(message.ID);
  let foundLink = "";
  for (const link of linkCheck.Links) {
    if (link.URL.includes(linkFragment)) {
      foundLink = link.URL;
    }
  }
  return foundLink;
};

export { smtpServerApi };
