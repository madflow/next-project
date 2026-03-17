import { Page, expect } from "@playwright/test";
import { MailpitClient } from "mailpit-api";
import assert from "node:assert";

const { SMTP_SERVER_API } = process.env;
assert(SMTP_SERVER_API);

const smtpServerApi = new MailpitClient(SMTP_SERVER_API);

export async function loginUser(page: Page, email: string, password: string) {
  await page.waitForSelector("data-testid=auth.login.form.email");
  await page.getByTestId("auth.login.form.email").fill(email);
  await page.getByTestId("auth.login.form.password").fill(password);

  const getSessionResponse = page.waitForResponse(
    (response) => response.url().includes("/api/auth/get-session") && response.status() === 200
  );
  await page.getByTestId("auth.login.form.submit").click();

  await getSessionResponse;

  await page.waitForSelector("data-testid=app.sidebar.user-menu-trigger");
}

export async function logoutUser(page: Page) {
  await page.getByTestId("app.sidebar.user-menu-trigger").click();
  await page.getByTestId("app.sign-out").click();
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

export async function getLatestEmail(email: string) {
  let tries = 0;
  const maxTries = 5;
  const delay = 1000; // 1 second

  while (tries < maxTries) {
    const searchMessages = await smtpServerApi.searchMessages({
      query: `to:"${email}"`,
    });
    if (searchMessages.messages.length > 0) {
      return searchMessages.messages[0];
    }
    tries++;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return null;
}

export async function inviteUser(page: Page, userEmail: string) {
  const getOrgResponsePromise = page.waitForResponse("api/auth/organization/get-full-organization");
  await page.getByTestId("app.organization-switcher").click();
  await getOrgResponsePromise;
  await page.getByTestId("app.organization-switcher.invite").click();
  await page.getByTestId("admin.users.invite.form.email").fill(userEmail);
  const inviteResponsePromise = page.waitForResponse("api/auth/organization/invite-member");
  await page.getByTestId("admin.users.invite.form.submit").click();
  await inviteResponsePromise;
  await page.getByTestId("invite-user-modal.close").click();
}

export async function selectOrganization(page: Page, orgName: string) {
  const organizationSwitcher = page.getByTestId("app.organization-switcher");
  await organizationSwitcher.click();
  await page.getByText(orgName, { exact: true }).click();
  await expect(organizationSwitcher.locator("span")).toHaveText(orgName);
}

export async function visitAcceptPageFromEmail(page: Page, userEmail: string) {
  const message = await getLatestEmail(userEmail);
  const acceptLink = await extractLinkFromMessage(message, "accept-invitation");
  expect(acceptLink).toBeTruthy();
  await smtpServerApi.deleteMessagesBySearch({ query: `to:"${userEmail}"` });
  await page.goto(acceptLink);
}

export { smtpServerApi };
